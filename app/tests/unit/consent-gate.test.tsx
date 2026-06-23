import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConsentGate } from "@/components/shared/consent-gate";

/*
  COMP-020 ConsentGate 测试：block 继续永久禁用且不可绕过（INV-02 核心不变量）；
  warn 未勾同意禁用、勾选后启用；pass 可继续；findings 渲染含 suggestion。
*/
describe("ConsentGate（COMP-020）", () => {
  it("block 态「继续」按钮始终禁用且不可绕过（INV-02）", async () => {
    const onProceed = vi.fn();
    render(
      <ConsentGate
        result="block"
        findings={[
          { level: "block", message: "检测到私有路径", suggestion: "移除后重试" },
        ]}
        onProceed={onProceed}
      />
    );
    const btn = screen.getByRole("button", { name: "继续" });
    expect(btn).toBeDisabled();
    await userEvent.click(btn);
    expect(onProceed).not.toHaveBeenCalled();
    expect(screen.getByText("存在阻止项，无法发布。")).toBeInTheDocument();
  });

  it("warn 态未勾同意时禁用，勾选后启用并可继续", async () => {
    const onProceed = vi.fn();
    render(
      <ConsentGate
        result="warn"
        findings={[{ level: "warn", message: "疑似内部代号" }]}
        onProceed={onProceed}
      />
    );
    const btn = screen.getByRole("button", { name: "继续" });
    expect(btn).toBeDisabled();
    await userEvent.click(screen.getByRole("checkbox"));
    expect(btn).toBeEnabled();
    await userEvent.click(btn);
    expect(onProceed).toHaveBeenCalled();
  });

  it("pass 态可直接继续", async () => {
    const onProceed = vi.fn();
    render(<ConsentGate result="pass" findings={[]} onProceed={onProceed} />);
    await userEvent.click(screen.getByRole("button", { name: "继续" }));
    expect(onProceed).toHaveBeenCalled();
  });

  it("findings 渲染消息与建议", () => {
    render(
      <ConsentGate
        result="warn"
        findings={[{ level: "warn", message: "问题 A", suggestion: "做 B" }]}
      />
    );
    expect(screen.getByText("问题 A")).toBeInTheDocument();
    expect(screen.getByText(/做 B/)).toBeInTheDocument();
  });
});
