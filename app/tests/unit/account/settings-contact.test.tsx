import "./_polyfill";
import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  afterEach,
  vi,
} from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { setupServer } from "msw/node";
import { accountHandlers } from "@/mocks/handlers/account";
import { SettingsContactView } from "@/components/account";

/*
  PAGE-063 设置·联系方式集成。自包含 setupServer(accountHandlers)。
  核心断言（INV-03）：默认私密 + 公开为显式 opt-in（保存时二次确认，无静默公开）。
*/
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/settings/contact",
}));

const server = setupServer(...accountHandlers);
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function renderView() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <SettingsContactView />
    </QueryClientProvider>
  );
}

describe("SettingsContactView（PAGE-063 集成）", () => {
  it("渲染披露策略 Callout（默认私密 + 仅接受后披露 + 可撤回）", async () => {
    renderView();
    const note = await screen.findByRole("note", {
      name: "联系方式披露策略",
    });
    expect(note).toHaveTextContent("默认完全私密");
    expect(note).toHaveTextContent("交换被接受后");
    expect(note).toHaveTextContent("撤回只影响未来");
  });

  it("GitHub/邮箱默认渲染 Private 文字徽（非仅颜色）", async () => {
    renderView();
    await waitFor(() =>
      expect(screen.getAllByText("Private").length).toBeGreaterThanOrEqual(2)
    );
    // 自定义渠道未设
    expect(screen.getByText("Not Set")).toBeInTheDocument();
  });

  it("切「设为公开」后保存须二次确认（INV-03 opt-in，无静默公开）", async () => {
    const user = userEvent.setup();
    renderView();
    await waitFor(() =>
      expect(screen.getAllByText("Private").length).toBeGreaterThanOrEqual(2)
    );
    // 切第一个「设为公开」开关（GitHub）
    const toggles = screen.getAllByRole("switch", { name: /设为公开/ });
    await user.click(toggles[0]);
    // 保存
    const save = screen.getByRole("button", { name: "保存设置" });
    await waitFor(() => expect(save).toBeEnabled());
    await user.click(save);
    // 弹出公开确认对话框（alertdialog）
    const dialog = await screen.findByRole("alertdialog");
    expect(dialog).toHaveTextContent("确认公开联系方式");
    expect(
      within(dialog).getByRole("button", { name: "确认公开并保存" })
    ).toBeInTheDocument();
  });

  it("渲染同意/披露记录（对方 handle + 方式 + 交换引用）", async () => {
    renderView();
    await waitFor(() =>
      expect(
        screen.getByText(/向 @knowledge-trader 披露 GitHub \+ 邮箱/)
      ).toBeInTheDocument()
    );
    expect(screen.getByText(/EX-2024-8842/)).toBeInTheDocument();
  });
});
