"use client";

/*
  COMP-050 ModuleDetailLayout（详情页两栏布局容器，PAGE-010）。
  桌面两栏：左主区（header/summary/sourceStats/manifest/privacy）+ 右侧栏（trust + CTA）。
  <768px 单列：侧栏（信任 + CTA）DOM 下沉至 Manifest 之前（ASM-025），CTA 仍高可见。
  生命周期分支：Published 完整；Delisted 仅占位（无 Manifest/侧栏）；Draft 仅 owner 可见预览；NotFound 404。
  语义：<main> + <aside>；唯一 <h1>（在 header 插槽内）。
*/
import type { ReactNode } from "react";
import { EmptyState } from "@/components/shared";

export type LifecycleState = "Published" | "Draft" | "Delisted" | "NotFound";

export interface ModuleDetailLayoutProps {
  lifecycleState: LifecycleState;
  isOwnerViewing: boolean;
  slots: {
    header: ReactNode;
    sourceStats: ReactNode;
    manifest: ReactNode;
    privacy: ReactNode;
    sidebar: ReactNode;
  };
}

export function ModuleDetailLayout({
  lifecycleState,
  isOwnerViewing,
  slots,
}: ModuleDetailLayoutProps) {
  if (lifecycleState === "NotFound") {
    return (
      <EmptyState
        icon="search"
        title="未找到该模块"
        description="该知识模块可能不存在或链接有误。"
        action={{ label: "返回发现", href: "/" }}
      />
    );
  }

  if (lifecycleState === "Delisted") {
    return (
      <EmptyState
        icon="visibility_off"
        title="该模块已下架"
        description="贡献者已将该模块下架，其清单与交换入口不再可用。"
        action={{ label: "返回发现", href: "/" }}
      />
    );
  }

  // Draft 仅 owner 本人可见预览；非 owner 视作不可访问。
  if (lifecycleState === "Draft" && !isOwnerViewing) {
    return (
      <EmptyState
        icon="lock"
        title="该模块尚未公开"
        description="这是一个草稿模块，仅作者本人可预览。"
        action={{ label: "返回发现", href: "/" }}
      />
    );
  }

  const draftBanner =
    lifecycleState === "Draft" ? (
      <div
        role="status"
        className="rounded-control border border-warning/40 bg-warning/10 px-4 py-2 text-sm text-warning"
      >
        草稿 · 未公开（仅你可见预览）
      </div>
    ) : null;

  return (
    <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
      {/* 主区（桌面 ~2/3） */}
      <main className="flex min-w-0 flex-1 flex-col gap-6">
        {draftBanner}
        {slots.header}
        {slots.sourceStats}
        {/* 移动端：侧栏（信任 + CTA）在此下沉，置于 Manifest 之前（ASM-025） */}
        <aside className="flex flex-col gap-6 lg:hidden" aria-label="信任与交换（移动端）">
          {slots.sidebar}
        </aside>
        {slots.manifest}
        {slots.privacy}
      </main>

      {/* 侧栏（桌面 ~1/3，移动端隐藏——已在主区内下沉渲染） */}
      <aside
        className="hidden w-full flex-col gap-6 lg:flex lg:w-80 lg:shrink-0"
        aria-label="信任与交换"
      >
        {slots.sidebar}
      </aside>
    </div>
  );
}
