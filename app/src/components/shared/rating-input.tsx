"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";
import type { FeedbackDimension } from "@/lib/types";

/*
  COMP-035 RatingInput（结构化反馈维度）。每维度为 radiogroup（aria-labelledby），分值为 radio，
  键盘可达；当前值有文字（"4 / 5"）非仅图标（NFR-007）。维度 label 关联。
*/
export interface RatingInputProps {
  dimensions: FeedbackDimension[];
  value: Record<string, number>;
  scale?: number;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  onChange: (dimensionKey: string, score: number) => void;
  onComplete?: (allScores: Record<string, number>) => void;
}

export function RatingInput({
  dimensions,
  value,
  scale = 5,
  disabled = false,
  required = false,
  error,
  onChange,
  onComplete,
}: RatingInputProps) {
  const baseId = useId();

  const handleChange = (key: string, score: number) => {
    onChange(key, score);
    const next = { ...value, [key]: score };
    if (onComplete && dimensions.every((d) => next[d.key] != null)) {
      onComplete(next);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {dimensions.map((dim) => {
        const labelId = `${baseId}-${dim.key}`;
        const current = value[dim.key];
        return (
          <div
            key={dim.key}
            role="radiogroup"
            aria-labelledby={labelId}
            aria-required={required || undefined}
          >
            <div id={labelId} className="text-sm font-medium text-text">
              {dim.label}
              {current != null && (
                <span className="ml-2 text-xs text-text-muted tabular-nums">
                  {current} / {scale}
                </span>
              )}
            </div>
            {dim.description && (
              <p className="text-xs text-text-subtle">{dim.description}</p>
            )}
            <div className="mt-1.5 flex gap-1.5">
              {Array.from({ length: scale }).map((_, i) => {
                const score = i + 1;
                const checked = current === score;
                return (
                  <button
                    key={score}
                    type="button"
                    role="radio"
                    aria-checked={checked}
                    aria-label={`${dim.label} 评 ${score} 分（满分 ${scale}）`}
                    disabled={disabled}
                    onClick={() => handleChange(dim.key, score)}
                    className={cn(
                      "flex size-8 items-center justify-center rounded-control border text-sm tabular-nums focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none",
                      checked
                        ? "border-primary bg-primary text-white"
                        : "border-border bg-surface text-text-muted hover:border-primary"
                    )}
                  >
                    {score}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
