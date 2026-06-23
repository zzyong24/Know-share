"use client";

import { FormField } from "@/components/shared";
import { Textarea } from "@/components/ui/textarea";

/*
  COMP-177 ReviewNoteInput（审核意见 / 处置原因输入）。
  关联裁决并写入 ENT-018 原因字段。对退回/要求修改/下架/封禁/驳回为必填（ASM-051/INV-11 精神），
  对「通过」可空。必填未填 → 关联确认按钮禁用 + 显示错误（由调用方据 required 派生）。
  不进 Telemetry（INV-09/NFR-001，审计与统计分离）。
*/
export interface ReviewNoteInputProps {
  value: string;
  required: boolean;
  onChange: (value: string) => void;
  /** 必填且为空时由调用方传入错误文案 */
  error?: string;
  placeholder?: string;
  maxLength?: number;
}

export function ReviewNoteInput({
  value,
  required,
  onChange,
  error,
  placeholder = "填写审核意见 / 处置原因…",
  maxLength = 500,
}: ReviewNoteInputProps) {
  return (
    <FormField
      label="审核意见 / 处置原因"
      required={required}
      error={error}
      hint={required ? "退回 / 下架 / 驳回需填写原因（写入审计）" : undefined}
      renderControl={(a11y) => (
        <Textarea
          id={a11y.id}
          aria-invalid={a11y["aria-invalid"]}
          aria-describedby={a11y["aria-describedby"]}
          aria-required={a11y["aria-required"]}
          value={value}
          maxLength={maxLength}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
        />
      )}
    />
  );
}
