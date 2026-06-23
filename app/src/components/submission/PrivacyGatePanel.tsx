"use client";

import { CodeBlock } from "@/components/shared/code-block";
import { StatusPill } from "@/components/shared/status-pill";
import { PrimaryButton } from "@/components/shared/primary-button";
import { SecondaryButton } from "@/components/shared/secondary-button";
import { Icon } from "@/components/shared/icon";
import { PRIVACY_RESULT_META } from "@/components/shared/status-pill";
import { PrivacyFindingList } from "./PrivacyFindingList";
import type {
  ManifestDraft,
  PrivacyScanResult,
} from "@/lib/queries/submission";

/*
  COMP-074 PrivacyGatePanel（第 3 步：隐私 Gate 校验，强约束容器，PAGE-022）。
  左 = 脱敏 Manifest 预览（COMP-024 等宽）；右 = COMP-075 发现列表；底 = 三态同意门。
  强约束（INV-02 的 UI 落点；后端须二次校验）：
  - block：「下一步」永久禁用、无任何旁路；仅「去修订」「重跑」
  - warn：须勾选显式同意复选框 + 写隐私 Consent 才启用「下一步」（NFR-005）
  - pass：仍须勾选同意（证明审阅过）后可继续
  扫描失败 / 改动未重跑 → 不默认放行。
*/
const WARN_CONSENT_TEXT =
  "我已审阅并同意在保留这些警告项的情况下提交。";
const PASS_CONSENT_TEXT = "我已审阅隐私扫描结果，确认可以继续。";

export interface PrivacyGatePanelProps {
  manifest: ManifestDraft;
  scanResult: PrivacyScanResult | null;
  isScanning?: boolean;
  scanError?: boolean;
  consentGiven: boolean;
  manifestChangedSinceScan?: boolean;
  onRunScan: () => void;
  onConsentToggle: (checked: boolean) => void;
  onRevise: () => void;
  onProceed: () => void;
}

export function PrivacyGatePanel({
  manifest,
  scanResult,
  isScanning = false,
  scanError = false,
  consentGiven,
  manifestChangedSinceScan = false,
  onRunScan,
  onConsentToggle,
  onRevise,
  onProceed,
}: PrivacyGatePanelProps) {
  const overall = scanResult?.overallStatus ?? null;
  const counts = {
    pass: scanResult?.findings.filter((f) => f.severity === "pass").length ?? 0,
    warn: scanResult?.findings.filter((f) => f.severity === "warn").length ?? 0,
    block: scanResult?.findings.filter((f) => f.severity === "block").length ?? 0,
  };

  // INV-02：未扫描 / 改动未重跑 / block / 扫描失败 → 永不可继续。
  const needsRescan = !scanResult || manifestChangedSinceScan;
  const isBlocked = overall === "block";
  const consentRequired = overall === "warn" || overall === "pass";
  const canProceed =
    !needsRescan &&
    !scanError &&
    !isBlocked &&
    consentRequired &&
    consentGiven;

  const proceedDisabled = !canProceed || isScanning;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-text">隐私 Gate 校验</h2>
          <p className="mt-1 text-sm text-text-muted">
            扫描在你本机执行，平台只接收脱敏后的结果（INV-01）。阻断项必须解决后才能继续。
          </p>
        </div>
        {overall && (
          <StatusPill
            tone={PRIVACY_RESULT_META[overall].tone}
            icon={PRIVACY_RESULT_META[overall].icon}
            label={PRIVACY_RESULT_META[overall].label}
          />
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* 左：脱敏 Manifest 预览（等宽，COMP-024） */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-text">脱敏 Manifest 预览</span>
            <SecondaryButton size="sm" variant="ghost" iconLeft="edit" onClick={onRevise}>
              回第 2 步编辑
            </SecondaryButton>
          </div>
          <CodeBlock
            language="json"
            label="manifest.json"
            sanitizeJson
            code={JSON.stringify(manifest, null, 2)}
          />
        </div>

        {/* 右：扫描发现（COMP-075） */}
        <div
          aria-busy={isScanning || undefined}
          aria-live="polite"
          className="flex flex-col gap-3"
        >
          <div className="flex items-center gap-2">
            <PrimaryButton
              size="sm"
              iconLeft="shield"
              loading={isScanning}
              onClick={onRunScan}
            >
              {scanResult ? "重跑隐私扫描" : "运行隐私扫描"}
            </PrimaryButton>
          </div>

          {scanError ? (
            <p className="flex items-center gap-1 rounded-control border border-danger/30 bg-danger/5 p-3 text-sm text-danger">
              <Icon name="error" size={14} aria-hidden />
              扫描失败，请重试或检查本机技能（不会默认放行）。
            </p>
          ) : !scanResult ? (
            <p className="rounded-control border border-border p-3 text-sm text-text-muted">
              尚未扫描。点击「运行隐私扫描」开始。
            </p>
          ) : manifestChangedSinceScan ? (
            <p className="flex items-center gap-1 rounded-control border border-warning/30 bg-warning/5 p-3 text-sm text-text-muted">
              <Icon name="warning" size={14} aria-hidden className="text-warning" />
              清单在扫描后被改动，请重跑扫描后再继续。
            </p>
          ) : (
            <PrivacyFindingList
              findings={scanResult.findings}
              sensitivityDeclaration={scanResult.sensitivityDeclaration}
              counts={counts}
              onReviseField={() => onRevise()}
            />
          )}
        </div>
      </div>

      {/* 底：三态同意门（INV-02 强约束核心） */}
      <section
        aria-label="隐私同意门"
        className="rounded-card border border-border bg-surface p-4"
      >
        {isBlocked ? (
          <div className="flex flex-col gap-2">
            <p className="flex items-center gap-2 font-medium text-danger">
              <Icon name="error" size={18} aria-hidden />
              存在 {counts.block} 项必须解决的阻断项，无法继续发布。
            </p>
            <p className="text-sm text-text-muted">
              请逐项按建议修订后重跑扫描。阻断项不可绕过（INV-02）。
            </p>
            <div className="mt-1 flex items-center gap-3">
              <SecondaryButton iconLeft="edit" onClick={onRevise}>
                去修订（回第 2 步）
              </SecondaryButton>
              <SecondaryButton iconLeft="shield" loading={isScanning} onClick={onRunScan}>
                重跑
              </SecondaryButton>
            </div>
          </div>
        ) : (
          <>
            {consentRequired && !needsRescan && !scanError && (
              <label className="flex items-start gap-2 text-sm text-text">
                <input
                  type="checkbox"
                  checked={consentGiven}
                  onChange={(e) => onConsentToggle(e.target.checked)}
                  className="mt-0.5"
                />
                <span>{overall === "warn" ? WARN_CONSENT_TEXT : PASS_CONSENT_TEXT}</span>
              </label>
            )}
            <div className="mt-3 flex items-center gap-3">
              <PrimaryButton
                disabled={proceedDisabled}
                aria-disabled={proceedDisabled}
                onClick={proceedDisabled ? undefined : onProceed}
              >
                下一步
              </PrimaryButton>
              {needsRescan && !scanError && (
                <span className="text-xs text-text-muted">请先完成隐私扫描。</span>
              )}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
