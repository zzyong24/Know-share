"use client";

import { Icon } from "./icon";
import { cn } from "@/lib/utils";

/*
  COMP-019 Stepper（竖向步骤）。当前步 aria-current="step"；done 含对勾 + 文字（非仅颜色）；
  blocked 步及其后续 aria-disabled 且不可点（INV-02 隐私门 block 锁后续）。只能回退到已完成步。
*/
export type StepStatus = "pending" | "active" | "done" | "error" | "blocked";

export interface Step {
  key: string;
  label: string;
  status: StepStatus;
}

export interface StepperProps {
  steps: Step[];
  currentKey: string;
  orientation?: "vertical" | "horizontal";
  onStepClick?: (key: string) => void;
}

const STATUS_TEXT: Record<StepStatus, string> = {
  pending: "未开始",
  active: "进行中",
  done: "已完成",
  error: "有错误",
  blocked: "已锁定",
};

export function Stepper({
  steps,
  currentKey,
  orientation = "vertical",
  onStepClick,
}: StepperProps) {
  return (
    <ol
      className={cn(
        "flex gap-1",
        orientation === "vertical" ? "flex-col" : "flex-row flex-wrap"
      )}
    >
      {steps.map((step, idx) => {
        const isCurrent = step.key === currentKey;
        // 仅允许回到已完成步；blocked/pending 不可点。
        const clickable =
          !!onStepClick && step.status === "done" && !isCurrent;
        const disabled = step.status === "blocked" || step.status === "pending";

        const inner = (
          <div className="flex items-center gap-3">
            <span
              className={cn(
                "flex size-7 items-center justify-center rounded-full text-xs font-medium",
                step.status === "done" && "bg-success text-white",
                step.status === "active" && "bg-primary text-white",
                step.status === "error" && "bg-danger text-white",
                step.status === "blocked" && "bg-danger/15 text-danger",
                step.status === "pending" && "bg-muted text-text-subtle"
              )}
              aria-hidden
            >
              {step.status === "done" ? (
                <Icon name="check" size={14} aria-hidden />
              ) : step.status === "blocked" ? (
                <Icon name="lock" size={14} aria-hidden />
              ) : (
                idx + 1
              )}
            </span>
            <span className="flex flex-col">
              <span
                className={cn(
                  "text-sm",
                  isCurrent ? "font-semibold text-text" : "text-text-muted"
                )}
              >
                {step.label}
              </span>
              <span className="text-xs text-text-subtle">
                第 {idx + 1} 步，{STATUS_TEXT[step.status]}
              </span>
            </span>
          </div>
        );

        return (
          <li
            key={step.key}
            aria-current={isCurrent ? "step" : undefined}
            className="py-1.5"
          >
            {clickable ? (
              <button
                type="button"
                onClick={() => onStepClick?.(step.key)}
                className="rounded text-left focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
              >
                {inner}
              </button>
            ) : (
              <div aria-disabled={disabled || undefined}>{inner}</div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
