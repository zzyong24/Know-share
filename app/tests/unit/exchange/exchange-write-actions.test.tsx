import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ExchangeOwnerActions } from "@/components/exchange";
import type { ExchangeStatus } from "@/lib/types";

/*
  COMP-099 ExchangeOwnerActions（交换操作面板）单元：按 viewerRole + status 门控
  接受/拒绝/取消；拒绝/取消必填原因 + 二次确认（后端 cancel 缺原因 → 400 守对齐）。
*/

const noop = vi.fn();

function renderActions(
  overrides: Partial<React.ComponentProps<typeof ExchangeOwnerActions>> = {}
) {
  const props: React.ComponentProps<typeof ExchangeOwnerActions> = {
    viewerRole: "owner",
    status: "Requested" as ExchangeStatus,
    isAuthenticated: true,
    onAccept: noop,
    onReject: noop,
    onCancel: noop,
    ...overrides,
  };
  return render(<ExchangeOwnerActions {...props} />);
}

describe("ExchangeOwnerActions（交换操作门控）", () => {
  beforeEach(() => vi.clearAllMocks());

  it("owner 且 Requested：显示「接受」「拒绝」，不显示「取消请求」", () => {
    renderActions({ viewerRole: "owner", status: "Requested" });
    expect(screen.getByRole("button", { name: "接受" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "拒绝" })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "取消请求" })
    ).not.toBeInTheDocument();
  });

  it("requester 且可取消态（Accepted）：显示「取消请求」，不显示接受/拒绝", () => {
    renderActions({ viewerRole: "requester", status: "Accepted" });
    expect(
      screen.getByRole("button", { name: "取消请求" })
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "接受" })).not.toBeInTheDocument();
  });

  it("requester 且终态（Completed）不可取消：不渲染任何操作", () => {
    const { container } = renderActions({
      viewerRole: "requester",
      status: "Completed",
    });
    expect(container).toBeEmptyDOMElement();
  });

  it("spectator / 非参与方：不渲染任何操作（INV-03）", () => {
    const { container } = renderActions({
      viewerRole: "spectator",
      status: "Requested",
    });
    expect(container).toBeEmptyDOMElement();
  });

  it("owner 但 Requested 之外（如 Accepted）不可再接受：不渲染操作", () => {
    const { container } = renderActions({
      viewerRole: "owner",
      status: "Accepted",
    });
    expect(container).toBeEmptyDOMElement();
  });

  it("接受走 onAccept", async () => {
    const onAccept = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderActions({ onAccept });
    await user.click(screen.getByRole("button", { name: "接受" }));
    await waitFor(() => expect(onAccept).toHaveBeenCalledTimes(1));
  });

  it("拒绝需必填原因：空原因点「继续」报错且不开确认/不调用 onReject", async () => {
    const onReject = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderActions({ onReject });
    await user.click(screen.getByRole("button", { name: "拒绝" }));
    // 内联原因收集态出现「继续」。
    await user.click(screen.getByRole("button", { name: "继续" }));
    expect(screen.getByText("请填写原因（必填）。")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "确认拒绝" })
    ).not.toBeInTheDocument();
    expect(onReject).not.toHaveBeenCalled();
  });

  it("拒绝：填原因 → 继续 → 二次确认 → 调用 onReject(reason)", async () => {
    const onReject = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderActions({ onReject });
    await user.click(screen.getByRole("button", { name: "拒绝" }));
    await user.type(screen.getByLabelText(/原因/), "内容不符合预期");
    await user.click(screen.getByRole("button", { name: "继续" }));
    expect(screen.getByText("确认拒绝该交换请求？")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "确认拒绝" }));
    await waitFor(() =>
      expect(onReject).toHaveBeenCalledWith("内容不符合预期")
    );
  });

  it("取消：填原因 → 继续 → 二次确认 → 调用 onCancel(reason)（后端缺原因 400 守对齐）", async () => {
    const onCancel = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderActions({ viewerRole: "requester", status: "Requested", onCancel });
    await user.click(screen.getByRole("button", { name: "取消请求" }));
    await user.type(screen.getByLabelText(/原因/), "暂不需要");
    await user.click(screen.getByRole("button", { name: "继续" }));
    expect(screen.getByText("确认取消该交换请求？")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "确认取消" }));
    await waitFor(() => expect(onCancel).toHaveBeenCalledWith("暂不需要"));
  });
});
