"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Stepper, type Step, type StepStatus } from "@/components/shared/stepper";
import { SkeletonBlock } from "@/components/shared/skeleton-block";
import { notify } from "@/components/shared/toast";
import { SourceTypePicker, validateStep1 } from "./SourceTypePicker";
import { ManifestBuilder } from "./ManifestBuilder";
import { PrivacyGatePanel } from "./PrivacyGatePanel";
import { SubmitPreviewCard } from "./SubmitPreviewCard";
import { SubmitConfirmPanel, type SubmitState } from "./SubmitConfirmPanel";
import { WizardNav } from "./WizardNav";
import {
  MODULE_TYPE_OPTIONS,
  SOURCE_TYPE_OPTIONS,
  PRIVATE_EXCHANGE_NOTE,
  sampleManifest,
} from "@/mocks/fixtures/submission";
import {
  useSubmissionDraft,
  useSubmissionSkills,
  useRunPrivacyScan,
  useSubmitSubmission,
  validateManifestStructure,
  type ManifestDraft,
  type PrivacyScanResult,
  type Step1Value,
  type StructureResult,
} from "@/lib/queries/submission";

/*
  COMP-070 SubmitWizard（向导外壳与状态编排者，PAGE-020~024）。
  组合左侧 COMP-019 Stepper + 当前步内容 + 底部 COMP-078 WizardNav；持有跨步草稿状态与守卫：
  - 线性推进，未来步不可跳入（IA-004）
  - 隐私门后任意 Manifest 改动 → gate-stale，前进被禁，需回第 3 步重跑（INV-02）
  不渲染具体步字段（交各步组件）、不做扫描算法本身（交本机技能 / mutation）。
*/
export const WIZARD_STEPS = [
  { index: 1 as const, key: "source", label: "选择来源类型" },
  { index: 2 as const, key: "manifest", label: "生成本地清单" },
  { index: 3 as const, key: "privacy-gate", label: "隐私 Gate 校验" },
  { index: 4 as const, key: "preview", label: "卡片预览" },
  { index: 5 as const, key: "confirm", label: "提交确认" },
];

export type StepKey = (typeof WIZARD_STEPS)[number]["key"];
type StepNum = 1 | 2 | 3 | 4 | 5;

function keyFromStep(step: StepNum): StepKey {
  return WIZARD_STEPS[step - 1].key;
}

export interface SubmitWizardProps {
  submissionId: string | null;
  initialStep: StepNum;
}

/** 轻量内容哈希（gate-stale 检测，ASM-083；非密码学用途）。 */
function hashManifest(m: ManifestDraft | null): string {
  if (!m) return "";
  const s = JSON.stringify(m);
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return String(h);
}

export function SubmitWizard({ submissionId, initialStep }: SubmitWizardProps) {
  const router = useRouter();
  const draftQuery = useSubmissionDraft(submissionId);
  const skillsQuery = useSubmissionSkills();
  const scanMutation = useRunPrivacyScan();
  const submitMutation = useSubmitSubmission();

  const [currentStep, setCurrentStep] = useState<StepNum>(initialStep);
  const [maxReached, setMaxReached] = useState<StepNum>(initialStep);

  // 跨步草稿状态（外壳持有）。
  const [step1, setStep1] = useState<Step1Value>({
    title: "",
    oneLineIntent: "",
    moduleType: "",
    sourceTypes: [],
  });
  const [step1Errors, setStep1Errors] = useState<
    Partial<Record<keyof Step1Value, string>>
  >({});

  const [manifestMode, setManifestMode] = useState<"generate" | "import">("generate");
  const [manifestText, setManifestText] = useState("");
  const [structureResult, setStructureResult] = useState<StructureResult | null>(null);
  const [validManifest, setValidManifest] = useState<ManifestDraft | null>(null);

  const [scanResult, setScanResult] = useState<PrivacyScanResult | null>(null);
  const [manifestHashAtScan, setManifestHashAtScan] = useState<string>("");
  const [privacyConsent, setPrivacyConsent] = useState(false);

  const [previewView, setPreviewView] = useState<"card" | "detail">("card");
  const [submitConsent, setSubmitConsent] = useState(false);
  const [submitState, setSubmitState] = useState<SubmitState>("idle");

  const [hydratedFor, setHydratedFor] = useState<string | null>(null);

  // 回填恢复草稿（restored-draft）：仅在首次拿到对应草稿时执行。
  const draft = draftQuery.data;
  if (draft && hydratedFor !== draft.id) {
    setHydratedFor(draft.id);
    setStep1(draft.module);
    if (draft.manifest) {
      setManifestText(JSON.stringify(draft.manifest, null, 2));
      setValidManifest(draft.manifest);
      setStructureResult({ valid: true, fieldErrors: {} });
    }
    if (draft.privacyScan) {
      setScanResult(draft.privacyScan);
      setManifestHashAtScan(draft.manifestHashAtScan ?? hashManifest(draft.manifest));
    }
  }

  // gate-stale：隐私门通过后 Manifest 改动 → 旧扫描 / 同意失效。
  const manifestChangedSinceScan =
    !!scanResult && hashManifest(validManifest) !== manifestHashAtScan;
  const isStale = manifestChangedSinceScan;

  const overall = scanResult?.overallStatus ?? null;

  // 各步可继续守卫（INV-02 在外壳层的强制点）。
  const canProceed = useMemo<boolean>(() => {
    switch (currentStep) {
      case 1:
        return Object.keys(validateStep1(step1)).length === 0;
      case 2:
        return !!structureResult?.valid && !!validManifest;
      case 3:
        return (
          !!scanResult &&
          !manifestChangedSinceScan &&
          overall !== "block" &&
          privacyConsent
        );
      case 4:
        return !isStale;
      case 5:
        return false; // 末步由 ConfirmPanel 内部提交，导航主按钮不直接前进。
      default:
        return false;
    }
  }, [
    currentStep,
    step1,
    structureResult,
    validManifest,
    scanResult,
    manifestChangedSinceScan,
    overall,
    privacyConsent,
    isStale,
  ]);

  const disabledReason = useMemo<string | undefined>(() => {
    if (currentStep === 3) {
      if (overall === "block") return "存在阻断项，无法继续";
      if (!scanResult || manifestChangedSinceScan) return "请先完成隐私扫描";
      if (!privacyConsent) return "请勾选隐私同意";
    }
    if (currentStep === 4 && isStale) return "清单已变更，请回隐私门重跑";
    return undefined;
  }, [currentStep, overall, scanResult, manifestChangedSinceScan, privacyConsent, isStale]);

  const goToStep = (step: StepNum) => {
    setCurrentStep(step);
    if (step > maxReached) setMaxReached(step);
    router.push(
      submissionId
        ? `/submit/${submissionId}/${keyFromStep(step)}`
        : `/submit/${keyFromStep(step)}`
    );
  };

  const handleNext = () => {
    if (currentStep === 1) {
      const errs = validateStep1(step1);
      setStep1Errors(errs);
      if (Object.keys(errs).length > 0) return;
      // ASM-082：进入第 2 步前出示生成范围同意门（外壳协调写入 Consent）。
      notify("已记录「生成触及范围」同意。", "info");
    }
    if (!canProceed) return;
    goToStep((currentStep + 1) as StepNum);
  };

  const handleBack = () => {
    if (currentStep > 1) goToStep((currentStep - 1) as StepNum);
  };

  const handleSaveDraft = () => notify("草稿已保存。", "info");
  const handleExit = () => router.push("/account");

  // 第 2 步：结构校验 / 导入 / 生成。
  const runStructureValidate = (text: string) => {
    const { parsed, result } = validateManifestStructure(text);
    setStructureResult(result);
    setValidManifest(parsed);
  };
  const handleManifestEdit = (text: string) => {
    setManifestText(text);
    setStructureResult(null);
    setValidManifest(null);
  };
  const handleImport = (text: string) => {
    setManifestText(text);
    runStructureValidate(text);
  };
  const handleGenerate = () => {
    // 本机技能产出脱敏 JSON（MOCK）；平台不接收原始内容（INV-01）。
    const text = JSON.stringify(sampleManifest, null, 2);
    setManifestText(text);
    runStructureValidate(text);
    notify("已在本机生成脱敏清单。", "success");
  };

  // 第 3 步：扫描 / 隐私同意。
  const handleRunScan = () => {
    if (!validManifest) return;
    setPrivacyConsent(false);
    scanMutation.mutate(validManifest, {
      onSuccess: (res) => {
        setScanResult(res);
        setManifestHashAtScan(hashManifest(validManifest));
      },
    });
  };

  // 第 5 步：提交。
  const handleSubmit = () => {
    if (overall === "block") {
      setSubmitState("block-guard");
      return;
    }
    setSubmitState("submitting");
    submitMutation.mutate(
      {
        submissionId: draft?.id ?? submissionId ?? "SUB-NEW-0001",
        consent: {
          actionType: "submit",
          scope: draft?.id ?? "submission",
        },
      },
      {
        onSuccess: () => setSubmitState("submitted"),
        onError: () => setSubmitState("error"),
      }
    );
  };

  // Stepper 步态：当前=active、已完成=done（可回退）、未达=pending（不可跳入）、第3步block→第4+ blocked。
  const steps: Step[] = WIZARD_STEPS.map((s) => {
    let status: StepStatus;
    if (s.index === currentStep) status = "active";
    else if (overall === "block" && s.index > 3) status = "blocked";
    else if (s.index < currentStep || s.index <= maxReached) status = "done";
    else status = "pending";
    // 当前步永远 active（覆盖上面 done）。
    if (s.index === currentStep) status = "active";
    return { key: s.key, label: s.label, status };
  });

  const onStepClick = (key: string) => {
    const target = WIZARD_STEPS.find((s) => s.key === key);
    if (!target) return;
    // 仅允许回到已完成（更小索引）步（线性约束，IA-004）。
    if (target.index < currentStep) goToStep(target.index);
  };

  if (draftQuery.isLoading) {
    return (
      <div aria-live="polite" aria-busy>
        <SkeletonBlock variant="card" count={2} />
      </div>
    );
  }
  if (draftQuery.isError) {
    return (
      <div className="rounded-card border border-danger/30 bg-danger/5 p-6 text-sm text-text-muted">
        加载草稿失败，请刷新或重新登录后再试（草稿不会丢失）。
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
      <aside aria-label="提交流程">
        <h1 className="mb-3 text-sm font-semibold text-text">提交模块</h1>
        <Stepper
          steps={steps}
          currentKey={keyFromStep(currentStep)}
          onStepClick={onStepClick}
        />
      </aside>

      <section>
        {currentStep === 1 && (
          <SourceTypePicker
            value={step1}
            moduleTypeOptions={MODULE_TYPE_OPTIONS}
            sourceTypeOptions={SOURCE_TYPE_OPTIONS}
            errors={step1Errors}
            onChange={(patch) => setStep1((v) => ({ ...v, ...patch }))}
          />
        )}

        {currentStep === 2 && (
          <ManifestBuilder
            mode={manifestMode}
            manifestText={manifestText}
            step1Context={{
              moduleType: step1.moduleType,
              sourceTypes: step1.sourceTypes,
            }}
            availableSkills={skillsQuery.data?.items ?? []}
            structureResult={structureResult}
            isGenerating={false}
            onModeChange={setManifestMode}
            onGenerate={handleGenerate}
            onImport={handleImport}
            onManifestEdit={handleManifestEdit}
            onValidateStructure={() => runStructureValidate(manifestText)}
            onOpenSkillCatalog={() => router.push("/skills")}
          />
        )}

        {currentStep === 3 && validManifest && (
          <PrivacyGatePanel
            manifest={validManifest}
            scanResult={scanResult}
            isScanning={scanMutation.isPending}
            scanError={scanMutation.isError}
            consentGiven={privacyConsent}
            manifestChangedSinceScan={manifestChangedSinceScan}
            onRunScan={handleRunScan}
            onConsentToggle={setPrivacyConsent}
            onRevise={() => goToStep(2)}
            onProceed={() => goToStep(4)}
          />
        )}

        {currentStep === 4 && validManifest && (
          <SubmitPreviewCard
            manifest={validManifest}
            view={previewView}
            isStale={isStale}
            onViewChange={setPreviewView}
            onEditManifest={() => goToStep(2)}
            onBackToGate={() => goToStep(3)}
          />
        )}

        {currentStep === 5 && validManifest && (
          <SubmitConfirmPanel
            summary={{
              title: validManifest.title || step1.title,
              sourceTypes: validManifest.source_types,
              privacyOverall: overall ?? "pass",
              manifestVersion: validManifest.version,
            }}
            privateExchangeNote={PRIVATE_EXCHANGE_NOTE}
            consentGiven={submitConsent}
            submitState={submitState}
            onConsentToggle={setSubmitConsent}
            onSubmit={handleSubmit}
            onBackToGate={() => goToStep(3)}
            onGoDashboard={() => router.push("/account")}
          />
        )}

        {/* 末步不渲染导航主前进按钮（提交在 ConfirmPanel 内）。 */}
        {currentStep < 5 && (
          <WizardNav
            step={currentStep}
            canProceed={canProceed}
            canGoBack={currentStep > 1}
            isLastStep={false}
            busy={scanMutation.isPending}
            disabledReason={disabledReason}
            hideNext={currentStep === 3}
            onNext={handleNext}
            onBack={handleBack}
            onSaveDraft={handleSaveDraft}
            onExit={handleExit}
          />
        )}
      </section>
    </div>
  );
}
