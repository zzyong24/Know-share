"use client";

import { SecondaryButton } from "@/components/shared";

/*
  COMP-118 TrustExplanationLink（信任解释入口 / 可解释性守卫）。
  承载 HARD-03「入口不可缺失」：信任分展示处始终可达拆解（PAGE-041，深链 ?explain=trust）。
  解释数据缺失时显示「解释生成中」占位而非裸分依赖。复用 COMP-008 SecondaryButton。
*/
export interface TrustExplanationLinkProps {
  githubLogin: string;
  /** 解释数据是否就绪（与 COMP-110/COMP-111 守卫一致） */
  explanationAvailable?: boolean;
  variant?: "link" | "button";
  onOpen?: () => void;
}

export function TrustExplanationLink({
  explanationAvailable = true,
  variant = "button",
  onOpen,
}: TrustExplanationLinkProps) {
  if (!explanationAvailable) {
    return (
      <span
        data-testid="trust-explanation-pending"
        role="status"
        className="text-xs text-text-subtle"
      >
        信任解释生成中…
      </span>
    );
  }

  if (variant === "link") {
    return (
      <button
        type="button"
        onClick={onOpen}
        aria-label="查看信任分如何形成"
        data-testid="trust-explanation-link"
        className="rounded-control text-sm font-medium text-primary underline focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
      >
        信任分如何形成？
      </button>
    );
  }

  return (
    <SecondaryButton
      iconLeft="info"
      aria-label="查看信任分如何形成"
      data-testid="trust-explanation-link"
      onClick={onOpen}
    >
      信任分如何形成
    </SecondaryButton>
  );
}
