"use client";

/*
  COMP-054 ManifestPreview（脱敏 Manifest JSON 预览，PAGE-013，#manifest）。
  包裹 CodeBlock（等宽 + 复制）渲染脱敏 Manifest，供 agent/开发者直读（NFR-002）。
  核心隐私不变量：渲染前按白名单过滤，强制屏蔽 contact 及任何私有字段（INV-03/04 / DEC-010 / ASM-024），
  即使 API 误传 contact 也不显示（FR-110 输出检查兜底）。
*/
import { useMemo, useState } from "react";
import {
  Card,
  CodeBlock,
  SecondaryButton,
  notify,
} from "@/components/shared";

export interface ManifestPreviewProps {
  /** 完整脱敏 Manifest（任意形状对象；组件按白名单过滤渲染）。 */
  manifest: object;
  defaultView?: "compact" | "full";
}

/** 公开白名单：仅这些键可进入预览（默认私密，INV-03/04）。 */
const PUBLIC_FIELDS = [
  "id",
  "title",
  "summary",
  "topics",
  "tags",
  "language",
  "owner_handle",
  "exchange_intent",
  "sensitivity",
  "covered_questions",
  "source_types",
  "freshness",
  "redaction_notes",
  "private_exchange_options",
  "license",
  "updated_at",
  "version",
] as const;

/** compact 视图：精简到决策关键字段。 */
const COMPACT_FIELDS = [
  "id",
  "title",
  "summary",
  "topics",
  "language",
  "owner_handle",
  "exchange_intent",
  "sensitivity",
  "version",
] as const;

function pick(
  obj: Record<string, unknown>,
  keys: readonly string[]
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const k of keys) {
    if (k in obj && obj[k] !== undefined) out[k] = obj[k];
  }
  return out;
}

export function ManifestPreview({
  manifest,
  defaultView = "compact",
}: ManifestPreviewProps) {
  const [viewMode, setViewMode] = useState<"compact" | "full">(defaultView);

  // 白名单过滤：屏蔽 contact / 任何非白名单字段（INV-03/ASM-024）。
  const sanitized = useMemo(() => {
    const fields = viewMode === "compact" ? COMPACT_FIELDS : PUBLIC_FIELDS;
    return pick(manifest as Record<string, unknown>, fields);
  }, [manifest, viewMode]);

  const code = JSON.stringify(sanitized, null, 2);

  return (
    <Card
      header={
        <div className="flex items-center justify-between gap-2">
          <h2 id="manifest" className="text-lg font-semibold text-text">
            Manifest
          </h2>
          <div className="flex items-center gap-2">
            <SecondaryButton
              variant="ghost"
              size="sm"
              onClick={() =>
                setViewMode((m) => (m === "compact" ? "full" : "compact"))
              }
              aria-label={
                viewMode === "compact" ? "切换到完整视图" : "切换到紧凑视图"
              }
            >
              {viewMode === "compact" ? "完整视图" : "紧凑视图"}
            </SecondaryButton>
          </div>
        </div>
      }
    >
      <CodeBlock
        code={code}
        language="json"
        label="manifest.json"
        sanitizeJson
        onCopy={(ok) =>
          ok
            ? notify("已复制 Manifest JSON", "success")
            : notify("复制失败", "error")
        }
      />
    </Card>
  );
}
