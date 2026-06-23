import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { server } from "@/mocks/server";
import { DiscoveryView } from "@/components/shell-discovery/DiscoveryView";

/*
  PAGE-002 页面级集成：DiscoveryView 经 query hooks + MSW 渲染真实卡片网格与统计 strip。
  覆盖默认（有数据）、空注册表（empty=true）两态；URL 通过 mocked useSearchParams 注入。
*/

let currentParams = new URLSearchParams();
const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
  useSearchParams: () => currentParams,
  usePathname: () => "/",
}));

function renderWithClient() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <DiscoveryView />
    </QueryClientProvider>
  );
}

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  server.resetHandlers();
  currentParams = new URLSearchParams();
  pushMock.mockReset();
});
afterAll(() => server.close());

describe("DiscoveryView（PAGE-002 集成）", () => {
  it("默认渲染模块卡片网格与平台统计 strip", async () => {
    currentParams = new URLSearchParams();
    renderWithClient();
    expect(
      screen.getByRole("heading", { level: 1, name: /让 Agent 帮你发现/ })
    ).toBeInTheDocument();
    // 卡片来自 MSW modules fixture
    await waitFor(() =>
      expect(screen.getByText("Agent 记忆系统设计模式")).toBeInTheDocument()
    );
    // 平台统计 strip（千分位）
    await waitFor(() => expect(screen.getByText("1,842")).toBeInTheDocument());
    expect(screen.getByText("12,857")).toBeInTheDocument();
  });

  it("empty=true 时渲染空注册表 EmptyState", async () => {
    currentParams = new URLSearchParams("empty=true");
    renderWithClient();
    await waitFor(() =>
      expect(screen.getByText("还没有公开模块")).toBeInTheDocument()
    );
  });
});
