"use client";

import { useState } from "react";
import { FilterTabs, CodeBlock } from "@/components/shared";
import { InstallSnippet } from "./InstallSnippet";

/*
  COMP-135 McpConfigBlock（MCP 配置块 + 安装方式 Tab）。
  MCP 工具 Tab：mcp.json 片段（等宽 + 复制，COMP-024 CodeBlock）。
  Skill 安装 Tab：安装说明（COMP-132 InstallSnippet）。
  Tab 用共享 COMP-027 FilterTabs（aria-selected、箭头键可达）。
  静态内容始终可渲染（不依赖网络，保证「如何接入」始终可读，PAGE-050 降级可读）。
  包名 know-share-mcp / CLI 前缀 know-share 为占位（ASM-040）；无密钥/私有 URL（INV-01/04）。
*/
export interface McpConfigBlockProps {
  mcpConfig: string;
  skillInstallText: string;
  defaultTab?: "mcp" | "skill";
  onCopy?: (tab: "mcp" | "skill", success: boolean) => void;
}

export function McpConfigBlock({
  mcpConfig,
  skillInstallText,
  defaultTab = "mcp",
  onCopy,
}: McpConfigBlockProps) {
  const [tab, setTab] = useState<"mcp" | "skill">(defaultTab);

  return (
    <div className="flex flex-col gap-3">
      <FilterTabs
        aria-label="安装方式"
        activeKey={tab}
        onChange={(k) => setTab(k as "mcp" | "skill")}
        tabs={[
          { key: "mcp", label: "MCP 工具", icon: "settings" },
          { key: "skill", label: "Skill 安装", icon: "auto_awesome" },
        ]}
      />
      {tab === "mcp" ? (
        <CodeBlock
          code={mcpConfig}
          language="json"
          label="mcp.json"
          onCopy={(ok) => onCopy?.("mcp", ok)}
        />
      ) : (
        <InstallSnippet
          command={skillInstallText}
          label="安装命令"
          language="bash"
          onCopy={(ok) => onCopy?.("skill", ok)}
        />
      )}
    </div>
  );
}
