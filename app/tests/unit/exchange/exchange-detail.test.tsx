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
import userEvent from "@testing-library/user-event";
import { setupServer } from "msw/node";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { exchangeHandlers } from "@/mocks/handlers/exchange";
import { ExchangeDetailView } from "@/components/exchange";

/*
  PAGE-031 交换详情页面级集成（自包含 setupServer(exchangeHandlers)）。
  演示会话 = @knowledge-trader。
  覆盖：时间线状态机渲染（FLOW-003）、披露仅 Accepted 后对该次参与方可见（INV-03）、
  非参与方锁定、披露二次确认（同意门）、零私有内容（INV-04）、反馈区状态门控、IM 门控。
*/
const server = setupServer(...exchangeHandlers);
const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/exchanges/x",
}));

function renderDetail(id: string) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <ExchangeDetailView exchangeId={id} />
    </QueryClientProvider>
  );
}

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  server.resetHandlers();
  pushMock.mockReset();
});
afterAll(() => server.close());

describe("ExchangeDetailView（PAGE-031 集成）", () => {
  it("渲染交换头 + 时间线状态机步骤（FLOW-003）", async () => {
    // EX-2024-8844：growth-lab → knowledge-trader，Completed（knowledge-trader 为参与方）。
    renderDetail("EX-2024-8844");
    await waitFor(() =>
      expect(screen.getByText(/#EX-2024-8844/)).toBeInTheDocument()
    );
    // 时间线步骤 label 来自 FLOW-003 可视步骤。
    expect(screen.getByText("已发起交换")).toBeInTheDocument();
    expect(screen.getByText("完成交换")).toBeInTheDocument();
  });

  it("参与方且 Accepted+ 时披露区可用并渲染可披露清单（INV-03）", async () => {
    renderDetail("EX-2024-8844");
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "披露联系方式" })
      ).toBeInTheDocument()
    );
    // 可披露态显示方式清单（脱敏占位）。
    expect(screen.getByText("选择要披露的方式")).toBeInTheDocument();
  });

  it("非参与方（spectator）时披露区锁定，不渲染任何真实联系方式（INV-03）", async () => {
    // EX-2024-8843：bot-dev → rag-builder，knowledge-trader 非参与方 → spectator。
    renderDetail("EX-2024-8843");
    await waitFor(() =>
      expect(screen.getByText(/交换被接受后可披露联系方式/)).toBeInTheDocument()
    );
    expect(
      screen.queryByRole("button", { name: "披露联系方式" })
    ).not.toBeInTheDocument();
    // 不出现对方真实联系方式（IM/邮箱快照）。
    expect(screen.queryByText(/@kt_handle/)).not.toBeInTheDocument();
  });

  it("披露需二次确认（同意门）并在确认后生成快照", async () => {
    const user = userEvent.setup();
    renderDetail("EX-2024-8844");
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "披露联系方式" })
      ).toBeInTheDocument()
    );
    // 选一种方式 → 点披露 → 弹二次确认。
    await user.click(screen.getByLabelText(/GitHub/));
    await user.click(screen.getByRole("button", { name: "披露联系方式" }));
    expect(
      screen.getByText("确认披露联系方式？")
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "确认披露" }));
    // 确认后转已披露态（出现「撤回披露」）。
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "撤回披露" })
      ).toBeInTheDocument()
    );
  });

  it("对方已披露 IM 时启用「在线沟通」；详情零私有 URL（INV-04）", async () => {
    renderDetail("EX-2024-8844");
    await waitFor(() =>
      expect(screen.getByText(/#EX-2024-8844/)).toBeInTheDocument()
    );
    // 对方披露含 IM → 「在线沟通 (IM)」按钮启用（非 disabled）。
    const imBtn = screen.getByRole("button", { name: /在线沟通/ });
    expect(imBtn).not.toBeDisabled();

    // 私下交付协议显示约定通道文案但无真实仓库 URL/邀请（INV-04/ASM-007）。
    expect(screen.getByText("GitHub 私有仓库邀请")).toBeInTheDocument();
    const html = document.body.innerHTML;
    expect(html).not.toMatch(/github\.com\/.+\/(invitations|private)/i);
    expect(html).not.toMatch(/https?:\/\/github\.com/i);
  });

  it("反馈区按状态门控：Completed 开启（不锁定）", async () => {
    renderDetail("EX-2024-8844");
    await waitFor(() =>
      expect(screen.getByText("评价与反馈")).toBeInTheDocument()
    );
    // Completed → 开启态，不显示锁定文案。
    expect(
      screen.queryByText("待交换完成后开启反馈。")
    ).not.toBeInTheDocument();
  });
});
