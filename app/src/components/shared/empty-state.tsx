"use client";

import { Icon } from "./icon";
import { PrimaryButton } from "./primary-button";
import { SecondaryButton } from "./secondary-button";
import type { Tone } from "@/lib/types";
import { SUBTLE_TONE } from "./tone";
import { cn } from "@/lib/utils";

/*
  COMP-021 EmptyState（空状态）。居中图标 + 标题 + 说明 + 主 CTA。
  图标装饰性 aria-hidden，语义在文字；CTA 为真实按钮/链接。
*/
export interface EmptyStateAction {
  label: string;
  onClick?: () => void;
  href?: string;
}

export interface EmptyStateProps {
  icon: string;
  title: string;
  description?: string;
  action?: EmptyStateAction;
  secondaryAction?: EmptyStateAction;
  tone?: Tone;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  tone = "neutral",
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
      <span
        className={cn(
          "flex size-12 items-center justify-center rounded-full",
          SUBTLE_TONE[tone]
        )}
      >
        <Icon name={icon} size={24} aria-hidden />
      </span>
      <h3 className="text-base font-semibold text-text">{title}</h3>
      {description && (
        <p className="max-w-sm text-sm text-text-muted">{description}</p>
      )}
      {(action || secondaryAction) && (
        <div className="mt-2 flex gap-3">
          {action &&
            (action.href ? (
              <a href={action.href}>
                <PrimaryButton>{action.label}</PrimaryButton>
              </a>
            ) : (
              <PrimaryButton onClick={action.onClick}>{action.label}</PrimaryButton>
            ))}
          {secondaryAction &&
            (secondaryAction.href ? (
              <a href={secondaryAction.href}>
                <SecondaryButton>{secondaryAction.label}</SecondaryButton>
              </a>
            ) : (
              <SecondaryButton onClick={secondaryAction.onClick}>
                {secondaryAction.label}
              </SecondaryButton>
            ))}
        </div>
      )}
    </div>
  );
}
