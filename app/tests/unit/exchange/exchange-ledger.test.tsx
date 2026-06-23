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
import { ExchangeLedgerView } from "@/components/exchange";

/*
  PAGE-030 公开交换记录页面级集成（自包含 setupServer(exchangeHandlers)）。
  覆盖：脱敏台账渲染、零私有内容（INV-04）、审核中交换隐藏（ASM-032）、
  状态机状态名（FLOW-003）、行点击路由、筛选写 URL、空态。
*/
const server = setupServer(...exchangeHandlers);

let currentParams = new URLSearchParams();
const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
  useSearchParams: () => currentParams,
  usePathname: () => "/exchanges",
}));

function renderView() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <ExchangeLedgerView />
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

describe("ExchangeLedgerView（PAGE-030 集成）", () => {
  it("渲染脱敏台账：脱敏交换号 + 状态机状态名，且无私有内容（INV-04）", async () => {
    renderView();
    await waitFor(() =>
      expect(screen.getByText("#EX-2024-8842")).toBeInTheDocument()
    );
    // 状态名严格对齐 FLOW-003（经 EXCHANGE_STATUS_META 中文 label）。
    expect(screen.getAllByText("已接受").length).toBeGreaterThan(0);
    expect(screen.getByText("已请求")).toBeInTheDocument();

    // 零私有内容：无私有仓库 URL / 邀请 / 联系方式（INV-01/04）。
    const html = document.body.innerHTML;
    expect(html).not.toMatch(/github\.com\/.+\/(invitations|private)/i);
    expect(html).not.toMatch(/@example\.com/);
    expect(html).not.toMatch(/private[_-]?url/i);
  });

  it("公开台账隐藏审核中/已标记交换（ASM-032/FLOW-005）", async () => {
    renderView();
    await waitFor(() =>
      expect(screen.getByText("#EX-2024-8842")).toBeInTheDocument()
    );
    // 种子中 EX-2024-8846 为 InReview，不应出现在公开台账。
    expect(screen.queryByText("#EX-2024-8846")).not.toBeInTheDocument();
    expect(screen.queryByText("审核中")).not.toBeInTheDocument();
  });

  it("点击行进入交换详情路由 /exchanges/:id", async () => {
    const user = userEvent.setup();
    renderView();
    await waitFor(() =>
      expect(screen.getByText("#EX-2024-8842")).toBeInTheDocument()
    );
    await user.click(screen.getByText("#EX-2024-8842"));
    expect(pushMock).toHaveBeenCalledWith("/exchanges/EX-2024-8842");
  });

  it("切换状态筛选写入可分享 URL", async () => {
    const user = userEvent.setup();
    renderView();
    await waitFor(() =>
      expect(screen.getByText("#EX-2024-8842")).toBeInTheDocument()
    );
    await user.click(screen.getByRole("tab", { name: /已完成/ }));
    expect(pushMock).toHaveBeenCalledWith("/exchanges?status=completed");
  });

  it("互惠与单向交换可区分（INV-05）", async () => {
    renderView();
    await waitFor(() =>
      expect(screen.getByText("#EX-2024-8842")).toBeInTheDocument()
    );
    // EX-2024-8842 互惠（有 offeredModule）→ 方向标记 aria-label 含「互惠交换」。
    expect(screen.getAllByLabelText("互惠交换").length).toBeGreaterThan(0);
    // EX-2024-8843 单向 → 「单向请求」。
    expect(screen.getAllByLabelText("单向请求").length).toBeGreaterThan(0);
  });

  it("筛选无结果显示空态（清除筛选）", async () => {
    currentParams = new URLSearchParams("q=不存在的关键词zzz");
    renderView();
    await waitFor(() =>
      expect(screen.getByText("当前筛选无匹配交换")).toBeInTheDocument()
    );
    expect(
      screen.getByRole("button", { name: "清除筛选" })
    ).toBeInTheDocument();
  });
});
