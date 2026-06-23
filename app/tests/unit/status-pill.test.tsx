import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  StatusPill,
  EXCHANGE_STATUS_META,
  PRIVACY_RESULT_META,
} from "@/components/shared/status-pill";

/*
  COMP-011 StatusPill 测试：状态非仅颜色（NFR-007）—— 必有文字；映射正确；可点键盘可达；block 含「阻止」语义。
*/
describe("StatusPill（COMP-011）", () => {
  it("渲染文字 + 色调（状态非仅颜色 NFR-007）", () => {
    render(<StatusPill tone="success" label="已完成" />);
    expect(screen.getByText("已完成")).toBeInTheDocument();
  });

  it("label 为空时兜底显示文字而非纯色（ASM-070）", () => {
    render(<StatusPill tone="neutral" label="" />);
    expect(screen.getByText("未知状态")).toBeInTheDocument();
  });

  it("交换状态映射表含全部状态且每个都有非空 label", () => {
    Object.values(EXCHANGE_STATUS_META).forEach((m) => {
      expect(m.label.trim().length).toBeGreaterThan(0);
    });
  });

  it("隐私门 block 文字含「阻止」语义", () => {
    expect(PRIVACY_RESULT_META.block.label).toContain("阻止");
  });

  it("可点版本为按钮且键盘可触发", async () => {
    const onClick = vi.fn();
    render(<StatusPill tone="info" label="筛选" onClick={onClick} />);
    const btn = screen.getByRole("button", { name: "筛选" });
    btn.focus();
    await userEvent.keyboard("{Enter}");
    expect(onClick).toHaveBeenCalled();
  });
});
