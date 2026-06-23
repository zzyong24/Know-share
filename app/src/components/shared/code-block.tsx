"use client";

import { useState } from "react";
import { Icon } from "./icon";
import { stripSensitiveFields } from "@/lib/api";
import { cn } from "@/lib/utils";

/*
  COMP-024 CodeBlock（等宽 + 复制）。等宽 JetBrains Mono 是契约（UI-001）。
  复制按钮 aria-label + 复制后 aria-live 播报；可键盘聚焦滚动。
  白名单：传 sanitize 时剥离私有 URL/字段（INV-01/04）。
*/
export interface CodeBlockProps {
  code: string;
  language?: "json" | "bash" | "text";
  showCopy?: boolean;
  maxHeight?: number;
  label?: string;
  /** 若为 JSON 公开数据，开启后剥离禁止公开字段 */
  sanitizeJson?: boolean;
  onCopy?: (success: boolean) => void;
}

export function CodeBlock({
  code,
  language = "text",
  showCopy = true,
  maxHeight = 360,
  label,
  sanitizeJson = false,
  onCopy,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const [liveMsg, setLiveMsg] = useState("");

  let rendered = code;
  if (sanitizeJson && language === "json") {
    try {
      const parsed = JSON.parse(code);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        rendered = JSON.stringify(
          stripSensitiveFields(parsed as Record<string, unknown>, "CodeBlock"),
          null,
          2
        );
      }
    } catch {
      /* 非法 JSON 原样展示 */
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(rendered);
      setCopied(true);
      setLiveMsg("已复制");
      onCopy?.(true);
      setTimeout(() => {
        setCopied(false);
        setLiveMsg("");
      }, 1500);
    } catch {
      setLiveMsg("复制失败");
      onCopy?.(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-control border border-border bg-muted">
      <div className="flex items-center justify-between border-b border-border px-3 py-1.5">
        <span className="font-mono text-xs text-text-muted">{label ?? language}</span>
        {showCopy && (
          <button
            type="button"
            aria-label="复制代码"
            onClick={handleCopy}
            className="inline-flex items-center gap-1 rounded text-xs text-text-muted hover:text-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
          >
            <Icon name={copied ? "check" : "content_copy"} size={14} aria-hidden />
            {copied ? "已复制" : "复制"}
          </button>
        )}
      </div>
      <pre
        tabIndex={0}
        style={{ maxHeight }}
        className={cn(
          "overflow-auto p-3 text-xs leading-relaxed focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
        )}
      >
        <code className="font-mono">{rendered}</code>
      </pre>
      <span aria-live="polite" className="sr-only">
        {liveMsg}
      </span>
    </div>
  );
}
