"use client";

import { FormField } from "@/components/shared/form-field";
import { IconChip } from "@/components/shared/icon-chip";
import { Icon } from "@/components/shared/icon";
import { cn } from "@/lib/utils";
import type { SourceType, Step1Value } from "@/lib/queries/submission";

/*
  COMP-071 SourceTypePicker（第 1 步：类型 / 来源选择，PAGE-020）。
  只采集分类信息（title / oneLineIntent / moduleType / sourceTypes）；
  绝不采集任何原始知识内容 / 私有路径 / 凭据（NFR-001/INV-01）。
  导航按钮在 COMP-078，不在本组件；同意门写入由外壳协调（ASM-082）。
*/
export interface ModuleTypeOption {
  value: string;
  label: string;
}
export interface SourceTypeOption {
  value: SourceType;
  label: string;
  icon: string;
}

const TITLE_MAX = 80;
const INTENT_MAX = 140;

export interface SourceTypePickerProps {
  value: Step1Value;
  moduleTypeOptions: readonly ModuleTypeOption[];
  sourceTypeOptions: readonly SourceTypeOption[];
  errors?: Partial<Record<keyof Step1Value, string>>;
  disabled?: boolean;
  onChange: (patch: Partial<Step1Value>) => void;
}

export function SourceTypePicker({
  value,
  moduleTypeOptions,
  sourceTypeOptions,
  errors = {},
  disabled = false,
  onChange,
}: SourceTypePickerProps) {
  const toggleSource = (st: SourceType) => {
    const next = value.sourceTypes.includes(st)
      ? value.sourceTypes.filter((x) => x !== st)
      : [...value.sourceTypes, st];
    onChange({ sourceTypes: next });
  };

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-lg font-semibold text-text">选择类型与来源</h2>
        <p className="mt-1 text-sm text-text-muted">
          本步只采集分类信息；不会采集任何原始笔记内容、私有路径或凭据（INV-01）。
        </p>
      </div>

      <FormField
        label="模块标题"
        required
        error={errors.title}
        hint={`简短描述模块主题（≤ ${TITLE_MAX} 字）`}
        renderControl={(a11y) => (
          <input
            {...a11y}
            type="text"
            value={value.title}
            maxLength={TITLE_MAX}
            disabled={disabled}
            onChange={(e) => onChange({ title: e.target.value })}
            className="w-full rounded-control border border-border bg-surface px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
          />
        )}
      />

      <FormField
        label="一句话用途"
        error={errors.oneLineIntent}
        hint={`说明希望交换什么（≤ ${INTENT_MAX} 字）`}
        renderControl={(a11y) => (
          <input
            {...a11y}
            type="text"
            value={value.oneLineIntent}
            maxLength={INTENT_MAX}
            disabled={disabled}
            onChange={(e) => onChange({ oneLineIntent: e.target.value })}
            className="w-full rounded-control border border-border bg-surface px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
          />
        )}
      />

      <FormField
        label="模块类型"
        required
        error={errors.moduleType}
        renderControl={(a11y) => (
          <div
            {...a11y}
            role="radiogroup"
            className="flex flex-wrap gap-2"
          >
            {moduleTypeOptions.map((opt) => {
              const selected = value.moduleType === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  disabled={disabled}
                  onClick={() => onChange({ moduleType: opt.value })}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-pill border px-3 py-1 text-sm focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none",
                    selected
                      ? "border-primary bg-primary-subtle font-semibold text-primary"
                      : "border-border bg-surface text-text-muted"
                  )}
                >
                  {selected && <Icon name="check" size={14} aria-hidden />}
                  {opt.label}
                </button>
              );
            })}
          </div>
        )}
      />

      <fieldset className="flex flex-col gap-2" disabled={disabled}>
        <legend className="text-sm font-medium text-text">
          来源类别（可多选）
          <span className="text-danger" aria-hidden>
            {" "}
            *
          </span>
        </legend>
        <div role="group" aria-label="来源类别" className="flex flex-wrap gap-2">
          {sourceTypeOptions.map((opt) => {
            const selected = value.sourceTypes.includes(opt.value);
            return (
              <label
                key={opt.value}
                className={cn(
                  "inline-flex cursor-pointer items-center gap-2 rounded-control border px-3 py-1.5 text-sm",
                  selected
                    ? "border-primary bg-primary-subtle text-primary"
                    : "border-border bg-surface text-text-muted"
                )}
              >
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={() => toggleSource(opt.value)}
                  className="sr-only"
                />
                <IconChip
                  icon={opt.icon}
                  size="sm"
                  tone={selected ? "primary" : "neutral"}
                />
                <span>{opt.label}</span>
                {selected && <Icon name="check" size={14} aria-hidden />}
              </label>
            );
          })}
        </div>
        {errors.sourceTypes && (
          <p className="flex items-center gap-1 text-xs text-danger">
            <Icon name="error" size={12} aria-hidden />
            {errors.sourceTypes}
          </p>
        )}
      </fieldset>
    </div>
  );
}

/** 第 1 步校验（zod 等价的纯函数；title 非空+长度、moduleType 必填、sourceTypes≥1）。 */
export function validateStep1(
  v: Step1Value
): Partial<Record<keyof Step1Value, string>> {
  const errors: Partial<Record<keyof Step1Value, string>> = {};
  if (!v.title.trim()) errors.title = "请填写模块标题。";
  else if (v.title.length > TITLE_MAX) errors.title = `标题不超过 ${TITLE_MAX} 字。`;
  if (!v.moduleType) errors.moduleType = "请选择模块类型。";
  if (v.sourceTypes.length === 0) errors.sourceTypes = "请至少选择一个来源类别。";
  return errors;
}
