import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  afterEach,
  vi,
} from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import { ModuleDetailView } from "@/components/module-detail";
import { moduleDetailHandlers } from "@/mocks/handlers/module-detail";

/*
  PAGE-010 集成：ModuleDetailView 经 useModuleDetail + 自包含 MSW（moduleDetailHandlers）渲染。
  自包含：本测试用自己的 setupServer 注入 module-detail handlers（不依赖全局聚合器，尚未接）。
  覆盖：Published 全装配、核心隐私不变量（不出现原始内容/contact）、404 分支。
*/

const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

const server = setupServer(...moduleDetailHandlers);

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  server.resetHandlers();
  pushMock.mockReset();
});
afterAll(() => server.close());

function renderView(props: { moduleId: string; currentUser?: string; isAuthenticated?: boolean }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <ModuleDetailView {...props} />
    </QueryClientProvider>
  );
}

describe("ModuleDetailView（PAGE-010 集成）", () => {
  it("Published：渲染标题、统计、Manifest、信任侧栏与请求交换 CTA", async () => {
    renderView({ moduleId: "m-agent-memory" });
    await waitFor(() =>
      expect(
        screen.getByRole("heading", {
          level: 1,
          name: /Agent 记忆系统设计模式/,
        })
      ).toBeInTheDocument()
    );
    expect(screen.getByText("来源统计与覆盖度")).toBeInTheDocument();
    expect(screen.getByText("Manifest")).toBeInTheDocument();
    // 侧栏在移动 + 桌面两处 DOM 渲染（ASM-025 下沉），故 getAll
    expect(screen.getAllByText("贡献者与信任").length).toBeGreaterThan(0);
    expect(
      screen.getAllByRole("button", { name: "请求交换" }).length
    ).toBeGreaterThan(0);
  });

  it("核心隐私不变量：页面不出现 contact / 私有 URL（INV-01/03/04）", async () => {
    const { container } = renderView({ moduleId: "m-agent-memory" });
    await waitFor(() =>
      expect(
        screen.getByRole("heading", { level: 1 })
      ).toBeInTheDocument()
    );
    expect(container.textContent).not.toContain("private@example.com");
    expect(container.textContent).not.toContain("contact");
  });

  it("owner 自看时禁用「请求交换」（ASM-021）", async () => {
    renderView({
      moduleId: "m-agent-memory",
      currentUser: "zyongzhu24",
      isAuthenticated: true,
    });
    await waitFor(() =>
      expect(
        screen.getAllByRole("button", { name: /这是你发布的模块/ })[0]
      ).toBeDisabled()
    );
  });

  it("404：未知模块显「未找到该模块」+ 返回发现", async () => {
    renderView({ moduleId: "does-not-exist" });
    await waitFor(() =>
      expect(screen.getByText("未找到该模块")).toBeInTheDocument()
    );
    expect(screen.getByText("返回发现")).toBeInTheDocument();
  });

  it("加载失败（500）走 NotFound 分支", async () => {
    server.use(
      http.get("/api/modules/:id/detail", () =>
        HttpResponse.json({ error: "boom" }, { status: 500 })
      )
    );
    renderView({ moduleId: "m-agent-memory" });
    await waitFor(() =>
      expect(screen.getByText("未找到该模块")).toBeInTheDocument()
    );
  });
});
