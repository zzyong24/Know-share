import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PrivacyGatePanel } from "@/components/submission/PrivacyGatePanel";
import { sampleManifest, scanPass, scanWarn, scanBlock } from "@/mocks/fixtures/submission";

/*
  COMP-074 PrivacyGatePanel 强约束（INV-02/NFR-005）单测：
  - block：「下一步」永久禁用、无旁路（核心硬规则）
  - warn：必须勾选显式同意后才启用「下一步」
  - pass：仍须勾选同意后可继续
  - 改动未重跑 / 扫描失败：不默认放行
*/
const baseProps = {
  manifest: sampleManifest,
  isScanning: false,
  scanError: false,
  manifestChangedSinceScan: false,
  onRunScan: vi.fn(),
  onConsentToggle: vi.fn(),
  onRevise: vi.fn(),
  onProceed: vi.fn(),
};

function nextButton() {
  return screen.getByRole("button", { name: "下一步" });
}

describe("PrivacyGatePanel（COMP-074 强约束）", () => {
  it("block：不渲染「下一步」按钮、提供去修订/重跑、无任何旁路（INV-02）", () => {
    render(<PrivacyGatePanel {...baseProps} scanResult={scanBlock} consentGiven={false} />);
    // block 态下无「下一步」按钮可用（无旁路）。
    expect(screen.queryByRole("button", { name: "下一步" })).not.toBeInTheDocument();
    expect(screen.getAllByText(/必须解决的阻断项/).length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: /去修订（回第 2 步）/ })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /重跑/ }).length).toBeGreaterThan(0);
  });

  it("block：即使同意已勾选也不放行（consentGiven 无效）", () => {
    render(<PrivacyGatePanel {...baseProps} scanResult={scanBlock} consentGiven={true} />);
    expect(screen.queryByRole("button", { name: "下一步" })).not.toBeInTheDocument();
  });

  it("warn：未勾选同意时「下一步」禁用，勾选后才启用（NFR-005）", () => {
    const onProceed = vi.fn();
    const { rerender } = render(
      <PrivacyGatePanel {...baseProps} scanResult={scanWarn} consentGiven={false} onProceed={onProceed} />
    );
    expect(nextButton()).toBeDisabled();
    // 勾选复选框 → 上报 onConsentToggle(true)
    const checkbox = screen.getByRole("checkbox");
    fireEvent.click(checkbox);
    expect(baseProps.onConsentToggle).toHaveBeenCalledWith(true);
    // 同意写入后（consentGiven=true）按钮启用
    rerender(
      <PrivacyGatePanel {...baseProps} scanResult={scanWarn} consentGiven={true} onProceed={onProceed} />
    );
    expect(nextButton()).toBeEnabled();
    fireEvent.click(nextButton());
    expect(onProceed).toHaveBeenCalled();
  });

  it("pass：仍须勾选同意后可继续", () => {
    const { rerender } = render(
      <PrivacyGatePanel {...baseProps} scanResult={scanPass} consentGiven={false} />
    );
    expect(nextButton()).toBeDisabled();
    rerender(<PrivacyGatePanel {...baseProps} scanResult={scanPass} consentGiven={true} />);
    expect(nextButton()).toBeEnabled();
  });

  it("未扫描：「下一步」禁用且提示先扫描（不默认放行）", () => {
    render(<PrivacyGatePanel {...baseProps} scanResult={null} consentGiven={true} />);
    expect(nextButton()).toBeDisabled();
    expect(screen.getByText(/请先完成隐私扫描/)).toBeInTheDocument();
  });

  it("改动未重跑：强制重跑、不继续（无陈旧同意）", () => {
    render(
      <PrivacyGatePanel
        {...baseProps}
        scanResult={scanPass}
        consentGiven={true}
        manifestChangedSinceScan={true}
      />
    );
    expect(nextButton()).toBeDisabled();
    expect(screen.getByText(/清单在扫描后被改动/)).toBeInTheDocument();
  });

  it("扫描失败：保持禁用、不默认放行", () => {
    render(<PrivacyGatePanel {...baseProps} scanResult={null} consentGiven={true} scanError={true} />);
    expect(nextButton()).toBeDisabled();
    expect(screen.getByText(/扫描失败/)).toBeInTheDocument();
  });

  it("locationRef 仅显示字段引用，不回显原始私有值全文（INV-01/INV-04）", () => {
    render(<PrivacyGatePanel {...baseProps} scanResult={scanBlock} consentGiven={false} />);
    // 命中位置以字段名（summary）呈现，而非任何原始私有值。
    expect(screen.getAllByText("summary").length).toBeGreaterThan(0);
  });
});
