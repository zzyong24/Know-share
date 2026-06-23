import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { VisibilityToggle } from "@/components/shared/visibility-toggle";

/*
  COMP-031 VisibilityToggle 测试：默认私密（INV-03/ASM-072 核心不变量）；状态有文字；切换后果提示；aria-checked。
*/
describe("VisibilityToggle（COMP-031）", () => {
  it("未提供 value 时默认渲染 private（INV-03 不变量）", () => {
    render(<VisibilityToggle label="GitHub 联系方式" />);
    expect(screen.getByText("私密")).toBeInTheDocument();
    const sw = screen.getByRole("switch");
    expect(sw).toHaveAttribute("aria-checked", "false");
  });

  it("状态有文字标签（非仅开关位置/颜色 NFR-007）", () => {
    render(<VisibilityToggle label="邮箱" value="public" />);
    expect(screen.getByText("公开")).toBeInTheDocument();
    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "true");
  });

  it("public 态显示后果提示", () => {
    render(<VisibilityToggle label="邮箱" value="public" />);
    expect(screen.getByText(/任何人可见/)).toBeInTheDocument();
  });

  it("切换触发 onChange 并传 public/private", async () => {
    const onChange = vi.fn();
    render(<VisibilityToggle label="邮箱" value="private" onChange={onChange} />);
    await userEvent.click(screen.getByRole("switch"));
    expect(onChange).toHaveBeenCalledWith("public");
  });

  it("disabled 时不可切换", async () => {
    const onChange = vi.fn();
    render(<VisibilityToggle label="邮箱" disabled onChange={onChange} />);
    await userEvent.click(screen.getByRole("switch"));
    expect(onChange).not.toHaveBeenCalled();
  });
});
