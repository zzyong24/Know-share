import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EmptyState } from "@/components/shared/empty-state";

/*
  COMP-021 EmptyState 测试：渲染标题/说明；CTA 触发；无 CTA 不渲染按钮。
*/
describe("EmptyState（COMP-021）", () => {
  it("渲染标题与说明", () => {
    render(
      <EmptyState icon="inbox" title="暂无模块" description="提交你的第一个模块" />
    );
    expect(screen.getByText("暂无模块")).toBeInTheDocument();
    expect(screen.getByText("提交你的第一个模块")).toBeInTheDocument();
  });

  it("CTA 触发 onClick", async () => {
    const onClick = vi.fn();
    render(
      <EmptyState
        icon="inbox"
        title="暂无模块"
        action={{ label: "去提交", onClick }}
      />
    );
    await userEvent.click(screen.getByRole("button", { name: "去提交" }));
    expect(onClick).toHaveBeenCalled();
  });

  it("无 CTA 时不渲染按钮", () => {
    render(<EmptyState icon="inbox" title="空" />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
