"use client";

import { CodeBlock } from "@/components/shared";

/*
  COMP-132 InstallSnippet（安装/示例命令片段）。
  基于共享 COMP-024 CodeBlock（等宽 JetBrains Mono + 复制 + aria-live）。
  硬规则：command 仅占位路径，不注入真实路径/密钥/私有 URL（INV-01/04）。
  复制成功/失败由 CodeBlock 内部处理（失败不静默，回退手动复制提示）。
*/
export interface InstallSnippetProps {
  command: string;
  label?: string;
  /** 仅供聚合遥测（非渲染 PII），如 example_command_copied 按 skillId 聚合。 */
  skillId?: string;
  language?: "bash" | "text";
  onCopy?: (success: boolean) => void;
}

export function InstallSnippet({
  command,
  label,
  skillId,
  language = "bash",
  onCopy,
}: InstallSnippetProps) {
  // skillId 仅用于上层遥测聚合上下文（不渲染为属性，避免泄露/无效 DOM 属性）。
  void skillId;
  return (
    <CodeBlock
      code={command}
      language={language === "bash" ? "bash" : "text"}
      label={label}
      onCopy={onCopy}
    />
  );
}
