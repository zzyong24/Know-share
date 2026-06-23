"use client";

import { FilterTabs } from "@/components/shared/filter-tabs";
import { StatusPill } from "@/components/shared/status-pill";
import { SecondaryButton } from "@/components/shared/secondary-button";
import { Icon } from "@/components/shared/icon";
import { AgentSkillCard } from "./AgentSkillCard";
import type { AgentSkill } from "@/lib/types";
import type { StructureResult } from "@/lib/queries/submission";

/*
  COMP-072 ManifestBuilder（第 2 步：生成 / 导入 Manifest，PAGE-021）。
  两路径：本地生成（本机技能，平台不接收原始内容）/ 导入 JSON。
  等宽编辑器：在 COMP-024 CodeBlock（只读）基础上扩展为可编辑 textarea（JetBrains Mono / 行内错误，ASM-084）。
  结构校验只保证「可被隐私门处理」，不等同隐私门（隐私分级在 COMP-074）。
*/
export interface ManifestBuilderProps {
  mode: "generate" | "import";
  manifestText: string;
  step1Context: { moduleType: string; sourceTypes: string[] };
  availableSkills: AgentSkill[];
  selectedSkillId?: string;
  structureResult: StructureResult | null;
  isGenerating?: boolean;
  onModeChange: (mode: "generate" | "import") => void;
  onGenerate: () => void;
  onImport: (text: string) => void;
  onManifestEdit: (text: string) => void;
  onValidateStructure: () => void;
  onSelectSkill?: (id: string) => void;
  onOpenSkillCatalog?: () => void;
}

export function ManifestBuilder({
  mode,
  manifestText,
  availableSkills,
  selectedSkillId,
  structureResult,
  isGenerating = false,
  onModeChange,
  onGenerate,
  onImport,
  onManifestEdit,
  onValidateStructure,
  onSelectSkill,
  onOpenSkillCatalog,
}: ManifestBuilderProps) {
  const fieldErrors = structureResult?.fieldErrors ?? {};
  const errorEntries = Object.entries(fieldErrors);

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onImport(String(reader.result ?? ""));
    reader.readAsText(file);
  };

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-lg font-semibold text-text">生成或导入清单</h2>
        <p className="mt-1 text-sm text-text-muted">
          清单是模块的脱敏公开摘要。生成在你本机执行，不上传原始内容（INV-01）。
        </p>
      </div>

      <FilterTabs
        aria-label="清单来源"
        tabs={[
          { key: "generate", label: "本地生成", icon: "auto_awesome" },
          { key: "import", label: "导入 JSON", icon: "code" },
        ]}
        activeKey={mode}
        onChange={(k) => onModeChange(k as "generate" | "import")}
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        {/* 中部：等宽 Manifest 编辑器（COMP-024 扩展可编辑，ASM-084） */}
        <div className="flex flex-col gap-3">
          {mode === "generate" ? (
            <div className="rounded-control border border-border bg-muted/40 p-3">
              <p className="text-sm text-text-muted">
                使用本机 Agent 技能在本机生成脱敏清单。
              </p>
              <SecondaryButton
                className="mt-2"
                iconLeft="auto_awesome"
                loading={isGenerating}
                onClick={onGenerate}
              >
                {isGenerating ? "在你本机生成…" : "本机生成清单"}
              </SecondaryButton>
            </div>
          ) : (
            <div className="rounded-control border border-border bg-muted/40 p-3">
              <label className="text-sm text-text-muted">
                粘贴或上传已有清单 JSON。
                <input
                  type="file"
                  accept=".json,application/json"
                  className="mt-2 block text-xs"
                  onChange={(e) => handleFile(e.target.files?.[0])}
                />
              </label>
            </div>
          )}

          <div className="overflow-hidden rounded-control border border-border bg-muted">
            <div className="flex items-center justify-between border-b border-border px-3 py-1.5">
              <span className="font-mono text-xs text-text-muted">manifest.json</span>
            </div>
            <textarea
              aria-label="Manifest JSON 编辑器"
              spellCheck={false}
              value={manifestText}
              onChange={(e) => onManifestEdit(e.target.value)}
              rows={16}
              className="w-full resize-y bg-transparent p-3 font-mono text-xs leading-relaxed focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <SecondaryButton iconLeft="fact_check" onClick={onValidateStructure}>
              校验清单结构
            </SecondaryButton>
            {structureResult && (
              <StatusPill
                tone={structureResult.valid ? "success" : "danger"}
                icon={structureResult.valid ? "check_circle" : "error"}
                label={structureResult.valid ? "结构有效" : "结构无效"}
              />
            )}
          </div>

          {structureResult?.contactNotice && (
            <p className="flex items-start gap-1 rounded-control border border-warning/30 bg-warning/5 p-2 text-xs text-text-muted">
              <Icon name="lock" size={14} aria-hidden className="mt-0.5 text-warning" />
              {structureResult.contactNotice}
            </p>
          )}

          {errorEntries.length > 0 && (
            <ul className="flex flex-col gap-1">
              {errorEntries.map(([field, msg]) => (
                <li key={field} className="flex items-center gap-1 text-xs text-danger">
                  <Icon name="error" size={12} aria-hidden />
                  {field === "_json" ? msg : `${field}：${msg}`}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 右栏：Agent 技能 / MCP（COMP-073） */}
        <AgentSkillCard
          skills={availableSkills}
          selectedSkillId={selectedSkillId}
          onSelectSkill={onSelectSkill}
          onOpenDoc={onOpenSkillCatalog}
          onOpenCatalog={onOpenSkillCatalog}
        />
      </div>
    </div>
  );
}
