"use client";

import { AboutHero } from "./AboutHero";
import { PlatformStatsSection } from "./PlatformStatsSection";
import { PrivacyTrustCards } from "./PrivacyTrustCards";
import { AboutFaq } from "./AboutFaq";
import { AuditLinkRow } from "./AuditLinkRow";
import { useAboutStats } from "@/lib/queries/about";

/*
  PAGE-100 整页编排：自上而下 Hero → 平台统计 → 隐私信任 → FAQ → 可审计链接。
  外壳为公开段 SiteShell（layout 已挂），本视图只编排五区块。
  仅统计区有动态数据；区块隔离——统计失败不影响其余区块（PAGE-100 States）。
  公开匿名可看（IA_SPEC 权限表）；无 PII（INV-09 / NFR-001）。
*/

// 平台公开仓库（发布时配置；指向公开仓库，不含私有内容 INV-04）。
const REPO_URL = "https://github.com/moonlitclear/Know-share";

export function AboutView() {
  const { data, isLoading, isError } = useAboutStats();

  const status: "loading" | "default" | "empty" | "error" = isError
    ? "error"
    : isLoading
      ? "loading"
      : data
        ? "default"
        : "empty";

  return (
    <div className="mx-auto max-w-5xl">
      <AboutHero
        tagline="让 Agent 帮你发现值得互换的知识库模块"
        subcopy="Know-share 是一个隐私优先、开源可审计的平台：原始内容留在你本地，agent 之间可发现、可评估、可对接，每一次交换都以所有者的明确同意为前提。"
        repoUrl={REPO_URL}
      />
      <PlatformStatsSection
        status={status}
        stats={data?.stats ?? null}
        monthlyActiveSeries={data?.monthlyActiveSeries ?? null}
        meta={data?.meta}
      />
      <PrivacyTrustCards />
      <AboutFaq />
      <AuditLinkRow />
    </div>
  );
}
