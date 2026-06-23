import { describe, it, expect, vi } from "vitest";
import { useState } from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RiskLabel } from "@/components/admin/risk-label";
import { PrivacyScanFindings } from "@/components/admin/privacy-scan-findings";
import { AuditLogList } from "@/components/admin/audit-log-list";
import { DestructiveConfirmDialog } from "@/components/admin/destructive-confirm-dialog";

/*
  admin 模块特有组件单测（COMP-174/179/180/178）。
  断言：风险等级文字非仅颜色、发现项分级文字、审计只读区分 actor、
  破坏性确认必填原因 + Esc 取消（NFR-007）。
*/

describe("RiskLabel（COMP-174）", () => {
  it("high 渲染「高风险」文字 + priority_high 图标（非仅颜色）", () => {
    render(<RiskLabel level="high" text="疑似含私有路径" />);
    expect(screen.getByText("高风险")).toBeInTheDocument();
    expect(screen.getByText("疑似含私有路径")).toBeInTheDocument();
  });
  it("none 渲染「无风险」等级词 + 描述文本", () => {
    render(<RiskLabel level="none" text="未检出隐私问题" />);
    expect(screen.getByText("无风险")).toBeInTheDocument();
    expect(screen.getByText("未检出隐私问题")).toBeInTheDocument();
  });
});

describe("PrivacyScanFindings（COMP-179）", () => {
  it("每项渲染分级文字 + 描述 + 建议；空态文案", () => {
    const { rerender } = render(
      <PrivacyScanFindings
        findings={[
          {
            id: "f1",
            description: "硬编码 IP 泄露",
            severity: "high",
            suggestion: "移除硬编码地址",
          },
        ]}
      />
    );
    expect(screen.getByText("高危")).toBeInTheDocument();
    expect(screen.getByText("硬编码 IP 泄露")).toBeInTheDocument();
    expect(screen.getByText(/移除硬编码地址/)).toBeInTheDocument();

    rerender(<PrivacyScanFindings findings={[]} />);
    expect(screen.getByText("无隐私发现。")).toBeInTheDocument();
  });
});

describe("AuditLogList（COMP-180）", () => {
  it("区分 @system 与人工行动者；空态显示 EmptyState", () => {
    const { rerender } = render(
      <AuditLogList
        entries={[
          {
            id: "a1",
            actorLogin: "system",
            action: "标记高风险",
            target: "模块#1022",
            createdAt: "2026-06-21T11:15:00Z",
          },
          {
            id: "a2",
            actorLogin: "admin",
            action: "通过了",
            target: "模块#1284",
            createdAt: "2026-06-20T10:00:00Z",
          },
        ]}
      />
    );
    expect(screen.getByText("系统")).toBeInTheDocument();
    expect(screen.getByText("人工")).toBeInTheDocument();

    rerender(<AuditLogList entries={[]} />);
    expect(screen.getByText("暂无审计记录")).toBeInTheDocument();
  });
});

describe("DestructiveConfirmDialog（COMP-178）", () => {
  it("requireReason 时空原因确认禁用，填后启用", async () => {
    function Harness() {
      const [reason, setReason] = useState("");
      return (
        <DestructiveConfirmDialog
          open
          action="delist"
          targetSummary="将下架模块「X」。"
          impactText="此操作记入审计。"
          requireReason
          reason={reason}
          onReasonChange={setReason}
          onConfirm={() => {}}
          onCancel={() => {}}
          onOpenChange={() => {}}
        />
      );
    }

    render(<Harness />);
    const dialog = await screen.findByRole("alertdialog");
    const confirm = within(dialog).getByRole("button", { name: "确认下架" });
    expect(confirm).toBeDisabled();

    const textarea = within(dialog).getByRole("textbox");
    await userEvent.type(textarea, "存在私有路径，下架处理");
    expect(
      within(dialog).getByRole("button", { name: "确认下架" })
    ).toBeEnabled();
  });

  it("Esc 触发 onOpenChange(false)（焦点陷入 + Esc 取消 NFR-007）", async () => {
    const onOpenChange = vi.fn();
    render(
      <DestructiveConfirmDialog
        open
        action="bulk_approve"
        targetSummary="将批量通过 2 项。"
        impactText="已排除非 pass 项。"
        requireReason={false}
        reason=""
        onReasonChange={() => {}}
        onConfirm={() => {}}
        onCancel={() => {}}
        onOpenChange={onOpenChange}
      />
    );
    await screen.findByRole("alertdialog");
    await userEvent.keyboard("{Escape}");
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
