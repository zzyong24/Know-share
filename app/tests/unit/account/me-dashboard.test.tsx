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
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { setupServer } from "msw/node";
import { accountHandlers } from "@/mocks/handlers/account";
import { MeDashboardView } from "@/components/account";

/*
  PAGE-060/061 个人中心容器 + 分区视图集成。
  自包含：setupServer(accountHandlers) + demoSession（handler 内置）+ QueryClient。
  覆盖：概览 StatBlock、子导航、modules 网格、drafts 空态。
*/
const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/me/modules",
}));

const server = setupServer(...accountHandlers);
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  server.resetHandlers();
  pushMock.mockReset();
});
afterAll(() => server.close());

function renderView(section: string) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MeDashboardView section={section as never} />
    </QueryClientProvider>
  );
}

describe("MeDashboardView（PAGE-060/061 集成）", () => {
  it("渲染概览 4 个 StatBlock + 子导航 + 我的模块网格", async () => {
    renderView("modules");
    // 欢迎条
    await waitFor(() =>
      expect(screen.getByText(/欢迎回来/)).toBeInTheDocument()
    );
    // StatBlock 标签（概览区内）
    const overview = screen.getByRole("region", { name: "个人中心概览" });
    expect(within(overview).getByText("我的模块")).toBeInTheDocument();
    expect(within(overview).getByText("进行中交换")).toBeInTheDocument();
    expect(within(overview).getByText("信任分")).toBeInTheDocument();
    // 信任分数值（派生）
    expect(within(overview).getByText("824")).toBeInTheDocument();
    // 子导航 + 当前项 aria-current
    const nav = screen.getByRole("navigation", { name: "个人中心导航" });
    const active = within(nav).getByRole("link", { current: "page" });
    expect(active).toHaveTextContent("我的模块");
    // 我的模块网格（来自 fixture，ownerLogin=zyongzhu24）
    await waitFor(() =>
      expect(screen.getByText("Agent 记忆系统设计模式")).toBeInTheDocument()
    );
  });

  it("收到的交换子导航项显示待处理徽标", async () => {
    renderView("modules");
    const nav = await screen.findByRole("navigation", { name: "个人中心导航" });
    await waitFor(() =>
      expect(
        within(nav).getByLabelText(/收到的交换，待处理 2 项/)
      ).toBeInTheDocument()
    );
  });

  it("drafts 分区渲染草稿行", async () => {
    renderView("drafts");
    await waitFor(() =>
      expect(
        screen.getByText("私有 RAG 评测脚手架（草稿）")
      ).toBeInTheDocument()
    );
    // 分区标题（heading，区别于子导航项）
    expect(
      screen.getByRole("heading", { level: 2, name: "草稿" })
    ).toBeInTheDocument();
  });
});
