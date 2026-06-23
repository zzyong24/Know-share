"use client";

import * as React from "react";
import { useId } from "react";
import { Label } from "@/components/ui/label";
import { Icon } from "./icon";
import { cn } from "@/lib/utils";

/*
  COMP-030 FormField（表单字段封装）。label htmlFor 关联控件 id；错误 aria-invalid + aria-describedby；
  必填 aria-required；错误文字非仅颜色（含图标 + 文字）。
  与 react-hook-form 配合：调用方把 register/Controller 的控件作为 children 传入，
  并通过 renderControl 注入 id/aria-*（保证关联）。
*/
export interface FormFieldProps {
  label: string;
  /** 渲染控件，注入无障碍属性以保证 label 关联与错误描述 */
  renderControl: (props: {
    id: string;
    "aria-invalid": boolean;
    "aria-describedby"?: string;
    "aria-required"?: boolean;
  }) => React.ReactNode;
  description?: string;
  hint?: string;
  required?: boolean;
  error?: string;
}

export function FormField({
  label,
  renderControl,
  description,
  hint,
  required = false,
  error,
}: FormFieldProps) {
  const id = useId();
  const descId = useId();
  const errId = useId();
  const describedBy =
    [error ? errId : null, description ? descId : null].filter(Boolean).join(" ") ||
    undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>
        {label}
        {required && (
          <span className="text-danger" aria-hidden>
            {" "}
            *
          </span>
        )}
      </Label>
      {description && (
        <p id={descId} className="text-xs text-text-muted">
          {description}
        </p>
      )}
      {renderControl({
        id,
        "aria-invalid": !!error,
        "aria-describedby": describedBy,
        "aria-required": required || undefined,
      })}
      {hint && !error && <p className="text-xs text-text-subtle">{hint}</p>}
      {error && (
        <p
          id={errId}
          className={cn("flex items-center gap-1 text-xs text-danger")}
        >
          <Icon name="error" size={12} aria-hidden />
          {error}
        </p>
      )}
    </div>
  );
}
