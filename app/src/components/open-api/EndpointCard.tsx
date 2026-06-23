"use client";

import { useId, useState } from "react";
import { Card, MethodPill, CodeBlock, Icon } from "@/components/shared";
import { AuthBadge } from "./AuthBadge";
import { AuthNoteBlock } from "./AuthNoteBlock";
import { RateLimitNote } from "./RateLimitNote";
import { EndpointFieldTable } from "./EndpointFieldTable";
import { WRITE_OP_POINTS } from "@/mocks/fixtures/open-api";
import type { ApiEndpoint } from "@/mocks/fixtures/open-api";

/*
  COMP-192 EndpointCard（端点文档卡）。本模块核心组件，基于共享 COMP-009 Card。
  方法/路径/说明/认证徽 + 可展开 JSON 示例与字段说明，让 agent 无需抓取页面即可集成
  （NFR-002 / FR-110）。仅文档展示，不执行真实写（POST 不越 NFR-005 同意门）。

  - 方法用 COMP-023 MethodPill：方法名文字始终在场（非仅颜色，NFR-007 / 归一项 2）。
  - GET=「公开读」、POST=「需 GitHub 认证 + 同意门」（AuthBadge，PAGE-090 验收 3）。
  - 展开/收起：<button aria-expanded> 控制 aria-controls 区域。
  - 响应示例经 CodeBlock sanitizeJson 兜底剥离禁止公开字段（INV-01/04 / ASM-055）。
  - 公开读端点渲染 RateLimitNote（FR-110 / NFR-006）；POST 渲染 AuthNoteBlock。
*/
export interface EndpointCardProps {
  endpoint: ApiEndpoint;
  defaultExpanded?: boolean;
  onToggleExpand?: (anchorId: string, expanded: boolean) => void;
  onCopyAnchor?: (anchorId: string) => void;
}

export function EndpointCard({
  endpoint,
  defaultExpanded = false,
  onToggleExpand,
  onCopyAnchor,
}: EndpointCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [anchorCopied, setAnchorCopied] = useState(false);
  const panelId = useId();

  const toggle = () => {
    const next = !expanded;
    setExpanded(next);
    onToggleExpand?.(endpoint.anchorId, next);
  };

  const copyAnchor = async () => {
    const deepLink =
      typeof window !== "undefined"
        ? `${window.location.origin}${window.location.pathname}#${endpoint.anchorId}`
        : `#${endpoint.anchorId}`;
    try {
      await navigator.clipboard.writeText(deepLink);
      setAnchorCopied(true);
      setTimeout(() => setAnchorCopied(false), 2000);
    } catch {
      /* 复制失败静默降级，不抛全局错误 */
    }
    onCopyAnchor?.(endpoint.anchorId);
  };

  const isPost = endpoint.method === "POST";

  return (
    <Card as="article" className="scroll-mt-24">
      <div id={endpoint.anchorId} className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <MethodPill method={endpoint.method} />
          <code className="font-mono text-sm font-medium text-text">
            {endpoint.path}
          </code>
          <AuthBadge kind={endpoint.auth} size="sm" />
          <div className="ml-auto flex items-center gap-1">
            <button
              type="button"
              aria-label={`复制 ${endpoint.method} ${endpoint.path} 的深链`}
              onClick={copyAnchor}
              className="inline-flex items-center gap-1 rounded p-1 text-xs text-text-muted hover:text-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            >
              <Icon name={anchorCopied ? "check" : "content_copy"} size={15} aria-hidden />
            </button>
            <button
              type="button"
              aria-expanded={expanded}
              aria-controls={panelId}
              aria-label={`${expanded ? "收起" : "展开"} ${endpoint.method} ${endpoint.path} 示例`}
              onClick={toggle}
              className="inline-flex items-center rounded p-1 text-text-muted hover:text-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            >
              <Icon name={expanded ? "expand_less" : "expand_more"} size={18} aria-hidden />
            </button>
          </div>
        </div>

        <p className="text-sm text-text">{endpoint.summary}</p>

        {endpoint.rateLimited && <RateLimitNote />}

        {expanded && (
          <div id={panelId} className="flex flex-col gap-4 pt-1">
            {isPost && <AuthNoteBlock points={WRITE_OP_POINTS} />}

            {endpoint.requestExample && (
              <div className="flex flex-col gap-2">
                <p className="text-xs font-semibold text-text-muted">请求示例</p>
                <CodeBlock
                  code={JSON.stringify(endpoint.requestExample, null, 2)}
                  language="json"
                  label="请求 JSON"
                />
                <EndpointFieldTable rows={endpoint.fields} kind="request" />
              </div>
            )}

            {!isPost && (
              <>
                <div className="flex flex-col gap-2">
                  <p className="text-xs font-semibold text-text-muted">响应示例</p>
                  <CodeBlock
                    code={JSON.stringify(endpoint.responseExample, null, 2)}
                    language="json"
                    label="响应 JSON"
                    sanitizeJson
                  />
                </div>
                <EndpointFieldTable rows={endpoint.fields} kind="response" />
              </>
            )}

            {isPost && (
              <div className="flex flex-col gap-2">
                <p className="text-xs font-semibold text-text-muted">响应示例</p>
                <CodeBlock
                  code={JSON.stringify(endpoint.responseExample, null, 2)}
                  language="json"
                  label="响应 JSON"
                  sanitizeJson
                />
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
