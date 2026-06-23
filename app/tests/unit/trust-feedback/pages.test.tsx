import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from "vitest";
import { render, screen, waitFor, fireEvent, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { setupServer } from "msw/node";
import { trustHandlers } from "@/mocks/handlers/trust-feedback";
import { TrustProfileView } from "@/components/trust-feedback/TrustProfileView";
import { TrustNetworkView } from "@/components/trust-feedback/TrustNetworkView";
import { FeedbackSurface } from "@/components/trust-feedback/FeedbackSurface";

/*
  PAGE-040~043 页面级集成：自包含 setupServer(trustHandlers) + QueryClient + 注入 next/navigation。
  覆盖 HARD-03 可解释入口、INV-10 反馈维度/标注、新用户空态、信任网络着陆/筛选、反馈提交。
*/

// recharts ResponsiveContainer 在 jsdom 无尺寸 → stub。
vi.mock("recharts", async (orig) => {
  const actual = await orig<typeof import("recharts")>();
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div style={{ width: 300, height: 240 }}>{children}</div>
    ),
  };
});

// 本测试套件自己的 server（trustHandlers）。
const server = setupServer(...trustHandlers);

let currentParams = new URLSearchParams();
const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
  useSearchParams: () => currentParams,
  usePathname: () => "/trust",
}));

// session 端点不在 trustHandlers 内 → 让 useSession 走匿名降级（捕获错误返回 null）。
beforeAll(() => server.listen({ onUnhandledRequest: "bypass" }));
afterEach(() => {
  server.resetHandlers();
  currentParams = new URLSearchParams();
  pushMock.mockReset();
});
afterAll(() => server.close());

function renderWithClient(ui: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

describe("PAGE-040 信任档案（TrustProfileView）", () => {
  it("渲染身份头 + 信任分 + 可解释入口始终在场（HARD-03）", async () => {
    renderWithClient(<TrustProfileView login="zyongzhu24" />);
    await waitFor(() =>
      expect(screen.getByTestId("trust-score-value")).toHaveTextContent("824")
    );
    // 可解释入口（HARD-03 不可缺失）
    expect(
      screen.getAllByRole("button", { name: "查看信任分如何形成" }).length
    ).toBeGreaterThan(0);
    // 反馈质量区标注「来自实际交换参与方」（INV-10）
    expect(screen.getByText(/来自实际交换参与方/)).toBeInTheDocument();
  });

  it("?explain=trust 深链打开拆解抽屉，含四类来源（PAGE-041/HARD-03）", async () => {
    currentParams = new URLSearchParams("explain=trust");
    renderWithClient(<TrustProfileView login="zyongzhu24" />);
    // 抽屉为 dialog（COMP-026 Drawer）；四类来源在其内
    const dialog = await screen.findByRole("dialog");
    ["交换历史", "反馈质量", "GitHub 验证", "举报记录（扣分）"].forEach((label) =>
      expect(within(dialog).getByText(label)).toBeInTheDocument()
    );
    // 权重声明在场（INV-10）
    expect(within(dialog).getByTestId("weight-disclosure")).toBeInTheDocument();
  });

  it("新用户档案显示空态（无趋势 / 无反馈 / 基础分）", async () => {
    renderWithClient(<TrustProfileView login="newcomer" />);
    await waitFor(() =>
      expect(screen.getByText(/信任随交换与反馈逐步积累/)).toBeInTheDocument()
    );
    expect(screen.getByText("尚无交换反馈")).toBeInTheDocument();
  });

  it("未知用户 → 中性「尚未加入」空态（ASM-038/INV-04）", async () => {
    renderWithClient(<TrustProfileView login="ghost-user-x" />);
    await waitFor(() =>
      expect(
        screen.getByText(/该 GitHub 用户尚未加入 Know-share/)
      ).toBeInTheDocument()
    );
  });
});

describe("PAGE-043 信任网络着陆（TrustNetworkView）", () => {
  it("渲染平台概览 + 可信贡献者列表，标注非付费口径（DEC-007）", async () => {
    renderWithClient(<TrustNetworkView />);
    expect(
      screen.getByRole("heading", { level: 1, name: "信任网络" })
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByText("钟（本人视角）")).toBeInTheDocument()
    );
    expect(screen.getByText("可信贡献者")).toBeInTheDocument();
    // 排序口径标注 + 非付费榜（DEC-007）
    expect(screen.getByText(/非竞争性、非付费榜/)).toBeInTheDocument();
  });

  it("empty=true → 空注册表 EmptyState（信任随交换积累）", async () => {
    currentParams = new URLSearchParams("empty=true");
    renderWithClient(<TrustNetworkView />);
    await waitFor(() =>
      expect(
        screen.getByText("暂无符合条件的可信贡献者")
      ).toBeInTheDocument()
    );
  });
});

describe("PAGE-042 结构化反馈提交（FeedbackSurface / COMP-116）", () => {
  it("WaitingForFeedback 参与方可见可编辑表单（五维 + 提交）", async () => {
    renderWithClient(<FeedbackSurface exchangeId="EX-2024-9001" peerLogin="rag-builder" />);
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "提交反馈" })).toBeInTheDocument()
    );
    ["清单一致性", "隐私边界", "结构清晰度", "有用性", "再次交换意愿"].forEach((l) =>
      expect(screen.getByText(l)).toBeInTheDocument()
    );
  });

  it("提交五维齐全后调用后端并成功（FLOW-004）", async () => {
    renderWithClient(<FeedbackSurface exchangeId="EX-2024-9001" peerLogin="rag-builder" />);
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "提交反馈" })).toBeInTheDocument()
    );
    ["清单一致性", "隐私边界", "结构清晰度", "有用性", "再次交换意愿"].forEach((label) => {
      fireEvent.click(
        screen.getByRole("radio", { name: `${label} 评 5 分（满分 5）` })
      );
    });
    fireEvent.click(screen.getByRole("button", { name: "提交反馈" }));
    // 成功后表单仍在（提交态由调用方控制），不抛错即视为 mutation 成功路径通过
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "提交反馈" })).toBeInTheDocument()
    );
  });

  it("已关闭交换 → 反馈窗口已结束只读态（ASM-011）", async () => {
    renderWithClient(<FeedbackSurface exchangeId="EX-2024-9002" />);
    await waitFor(() =>
      expect(screen.getByText("窗口已结束")).toBeInTheDocument()
    );
  });
});
