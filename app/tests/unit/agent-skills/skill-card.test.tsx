import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SkillCard } from "@/components/agent-skills/SkillCard";
import { SupportedSourceBadge } from "@/components/agent-skills/SupportedSourceBadge";
import type { AgentSkillDetail } from "@/lib/queries/agent-skills";
import type { SupportedSource } from "@/lib/queries/agent-skills";

/*
  COMP-130 SkillCard / COMP-134 SupportedSourceBadge 单元测试。
  覆盖：点击卡片主体 → onOpenDetail；点击查看文档 → onDocsClick（不冒泡触发 onOpenDetail）；
  docsUrl 缺失 → 文档按钮 disabled；来源标记单一图标族 + 链接态。
*/

const skill: AgentSkillDetail = {
  id: "sk-x",
  slug: "create-manifest",
  name: "Create Manifest",
  zhName: "创建脱敏清单",
  iconChip: { glyph: "description", tone: "primary" },
  runLocation: "local",
  summary: "摘要",
  input: "本地路径",
  output: "manifest.json",
  cliCommand: "know-share create-manifest --notes ./my-notes",
  mcpToolName: "create_manifest",
  privacyLevel: "local",
  privacyNote: "本地运行",
  consentNote: "需你确认",
  flowRef: "FLOW-001",
  docsUrl: "https://docs.example.com/skills/create-manifest",
};

describe("SkillCard（COMP-130）", () => {
  it("点击卡片主体触发 onOpenDetail", () => {
    const onOpenDetail = vi.fn();
    render(<SkillCard skill={skill} onOpenDetail={onOpenDetail} />);
    fireEvent.click(
      screen.getByRole("button", { name: "查看技能详情：创建脱敏清单" })
    );
    expect(onOpenDetail).toHaveBeenCalledWith("create-manifest");
  });

  it("点击查看文档触发 onDocsClick 且不冒泡触发 onOpenDetail", () => {
    const onOpenDetail = vi.fn();
    const onDocsClick = vi.fn();
    render(
      <SkillCard
        skill={skill}
        onOpenDetail={onOpenDetail}
        onDocsClick={onDocsClick}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /查看文档/ }));
    expect(onDocsClick).toHaveBeenCalledWith("create-manifest");
    expect(onOpenDetail).not.toHaveBeenCalled();
  });

  it("docsUrl 缺失时文档按钮 disabled（不导向死链）", () => {
    const { docsUrl: _omit, ...noDocs } = skill;
    void _omit;
    render(<SkillCard skill={noDocs as AgentSkillDetail} />);
    const docsBtn = screen.getByRole("button", { name: /查看文档/ });
    expect(docsBtn).toBeDisabled();
  });
});

describe("SupportedSourceBadge（COMP-134）", () => {
  const source: SupportedSource = {
    id: "obsidian",
    name: "Obsidian",
    iconChip: { glyph: "description", tone: "accent" },
  };

  it("展示来源名称与单一图标族（lucide svg）", () => {
    const { container } = render(<SupportedSourceBadge source={source} />);
    expect(screen.getByText("Obsidian")).toBeInTheDocument();
    expect(container.querySelector("svg")).not.toBeNull();
    expect(container.querySelector(".material-symbols-outlined")).toBeNull();
  });

  it("有 href 且 asLink 时渲染为链接", () => {
    render(
      <SupportedSourceBadge
        source={{ ...source, href: "/skills/create-manifest" }}
        asLink
      />
    );
    expect(screen.getByRole("link", { name: /Obsidian/ })).toHaveAttribute(
      "href",
      "/skills/create-manifest"
    );
  });

  it("无 href 时为纯展示（无链接角色）", () => {
    render(<SupportedSourceBadge source={source} asLink />);
    expect(screen.queryByRole("link")).toBeNull();
  });
});
