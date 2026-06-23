"use client";

import { ModuleCard } from "@/components/shared/module-card";
import { Card } from "@/components/shared/card";
import { TopicChip } from "@/components/shared/topic-chip";
import { CodeBlock } from "@/components/shared/code-block";
import { FilterTabs } from "@/components/shared/filter-tabs";
import { SecondaryButton } from "@/components/shared/secondary-button";
import { Icon } from "@/components/shared/icon";
import type { ManifestDraft } from "@/lib/queries/submission";
import type { KnowledgeModule } from "@/lib/types";

/*
  COMP-076 SubmitPreviewCard（第 4 步：卡片预览，PAGE-023）。
  预览「离开本机后别人看到什么」：卡片视图（COMP-010，与 IA-002 同口径）/ 详情公开面。
  严格只渲染脱敏 Manifest 公开字段，显式分隔「公开可见 / 不公开」（contact 进不公开区，DEC-010/INV-03）。
  stale：隐私门后被改 → 禁前进、需回第 3 步重跑（INV-02 不被绕过）。
*/
const PUBLIC_FIELDS = [
  "title",
  "summary",
  "topics",
  "tags",
  "source_types",
  "freshness",
  "sensitivity",
  "redaction_notes",
  "license",
  "updated_at",
  "version",
] as const;

export interface SubmitPreviewCardProps {
  manifest: ManifestDraft;
  view: "card" | "detail";
  isStale?: boolean;
  onViewChange: (view: "card" | "detail") => void;
  onEditManifest: () => void;
  onBackToGate: () => void;
}

/** 公开投影：仅取白名单字段，构造发现页同款 KnowledgeModule（INV-04）。 */
function toPublicModule(m: ManifestDraft): KnowledgeModule {
  return {
    id: m.id,
    title: m.title,
    summary: m.summary,
    topics: m.topics,
    sourceStats: { notes: 0, links: 0, files: 0, words: 0 },
    trustLevel: "new",
    status: "Draft",
    exchangeCount: 0,
    favoriteCount: 0,
    freshness: m.freshness ?? "新模块",
    ownerLogin: m.owner_handle ?? "you",
  };
}

function publicJson(m: ManifestDraft): string {
  const out: Record<string, unknown> = {};
  for (const f of PUBLIC_FIELDS) {
    const v = (m as unknown as Record<string, unknown>)[f];
    if (v !== undefined) out[f] = v;
  }
  return JSON.stringify(out, null, 2);
}

export function SubmitPreviewCard({
  manifest,
  view,
  isStale = false,
  onViewChange,
  onEditManifest,
  onBackToGate,
}: SubmitPreviewCardProps) {
  if (isStale) {
    return (
      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-text">卡片预览</h2>
        <div className="rounded-card border border-warning/30 bg-warning/5 p-6 text-center">
          <p className="mb-3 flex items-center justify-center gap-1 text-sm text-text-muted">
            <Icon name="warning" size={16} aria-hidden className="text-warning" />
            清单在隐私门后被改动，需回第 3 步重跑隐私扫描后才能继续（INV-02）。
          </p>
          <SecondaryButton iconLeft="shield" onClick={onBackToGate}>
            回隐私门重跑
          </SecondaryButton>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-text">卡片预览</h2>
          <p className="mt-1 text-sm text-text-muted">
            这是模块公开后别人看到的内容（脱敏字段）。
          </p>
        </div>
        <SecondaryButton size="sm" variant="ghost" iconLeft="edit" onClick={onEditManifest}>
          编辑清单
        </SecondaryButton>
      </div>

      <FilterTabs
        aria-label="预览视图"
        tabs={[
          { key: "card", label: "卡片视图", icon: "label" },
          { key: "detail", label: "详情视图", icon: "description" },
        ]}
        activeKey={view}
        onChange={(k) => onViewChange(k as "card" | "detail")}
      />

      {view === "card" ? (
        <div className="max-w-md">
          <ModuleCard module={toPublicModule(manifest)} href={`/modules/${manifest.id}`} />
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <Card header={<h3 className="text-sm font-semibold text-text">公开摘要</h3>}>
            <p className="text-sm text-text-muted">{manifest.summary}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {manifest.topics.map((t) => (
                <TopicChip key={t} label={t} />
              ))}
            </div>
            <dl className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-subtle">
              <span>来源类别 {manifest.source_types.join("、")}</span>
              <span>敏感度 {manifest.sensitivity}</span>
              {manifest.freshness && <span>{manifest.freshness}</span>}
            </dl>
            <p className="mt-3 text-xs text-text-muted">
              隐私边界 / 内容承诺：{manifest.redaction_notes}
            </p>
          </Card>
          <CodeBlock
            language="json"
            label="公开 Manifest 视图"
            code={publicJson(manifest)}
          />
        </div>
      )}

      {/* 不公开区（显式分隔；contact 永不出现在公开面，DEC-010/INV-03） */}
      <Card header={<h3 className="text-sm font-semibold text-text">不公开</h3>}>
        <ul className="flex flex-col gap-1 text-sm text-text-muted">
          <li className="flex items-center gap-1">
            <Icon name="lock" size={14} aria-hidden />
            联系方式：默认私密，仅在交换被接受后对对方披露，不随公开清单展示。
          </li>
          <li className="flex items-center gap-1">
            <Icon name="lock" size={14} aria-hidden />
            原始知识内容 / 私有路径：从不离开本机（INV-01）。
          </li>
        </ul>
      </Card>
    </div>
  );
}
