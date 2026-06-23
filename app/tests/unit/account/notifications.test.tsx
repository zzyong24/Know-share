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
import { http, HttpResponse } from "msw";
import {
  accountHandlers,
  __resetAccountStore,
} from "@/mocks/handlers/account";
import { NotificationsView } from "@/components/account";

/*
  PAGE-062 通知中心集成。自包含 setupServer(accountHandlers)。
  覆盖：未读态（非仅颜色）、全部标记已读乐观更新、空态。
*/
const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/notifications",
}));

const server = setupServer(...accountHandlers);
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  server.resetHandlers();
  __resetAccountStore();
  pushMock.mockReset();
});
afterAll(() => server.close());

function renderView() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <NotificationsView />
    </QueryClientProvider>
  );
}

describe("NotificationsView（PAGE-062 集成）", () => {
  it("渲染页头 + 5 个筛选 Tab，默认「全部」选中", async () => {
    renderView();
    expect(
      screen.getByRole("heading", { level: 1, name: "通知" })
    ).toBeInTheDocument();
    const tablist = await screen.findByRole("tablist", { name: "通知筛选" });
    expect(within(tablist).getAllByRole("tab")).toHaveLength(5);
    const allTab = within(tablist).getByRole("tab", { name: "全部" });
    expect(allTab).toHaveAttribute("aria-selected", "true");
  });

  it("未读通知有圆点 + sr-only「未读」文本（非仅颜色）", async () => {
    renderView();
    // n-1 未读
    await waitFor(() =>
      expect(screen.getByText("交换请求已接受")).toBeInTheDocument()
    );
    // 未读语义文本存在
    expect(screen.getAllByText("未读：").length).toBeGreaterThan(0);
  });

  it("「全部标记已读」乐观清零未读，按钮随后禁用", async () => {
    const user = userEvent.setup();
    renderView();
    const btn = await screen.findByRole("button", { name: "全部标记已读" });
    await waitFor(() => expect(btn).toBeEnabled());
    await user.click(btn);
    // 乐观：未读文本消失
    await waitFor(() =>
      expect(screen.queryByText("未读：")).not.toBeInTheDocument()
    );
    await waitFor(() => expect(btn).toBeDisabled());
  });

  it("空通知渲染空态", async () => {
    server.use(
      http.get("/api/notifications", () =>
        HttpResponse.json({ items: [], unreadCount: 0 })
      )
    );
    renderView();
    await waitFor(() =>
      expect(screen.getByText("暂无通知")).toBeInTheDocument()
    );
  });
});
