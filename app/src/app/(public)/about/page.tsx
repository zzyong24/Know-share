import type { Metadata } from "next";
import { AboutView } from "@/components/about";

/*
  PAGE-100 关于 / 仓库 / 帮助整页（route /about，IA-013）。
  公开、匿名可看（IA_SPEC 权限表）；外壳由公开段 layout 的 SiteShell 提供。
  五区块：Hero（PAGE-101）→ 平台统计（PAGE-102）→ 隐私信任（PAGE-103）→ FAQ（PAGE-104）→ 可审计链接（PAGE-105）。
*/
export const metadata: Metadata = {
  title: "关于 / 仓库 / 帮助 · Know-share",
  description:
    "Know-share 是隐私优先、开源可审计的知识库模块发现与交换平台。了解平台理念、聚合统计、隐私与信任模型，以及可审计的规则与数据契约。",
};

export default function AboutPage() {
  return <AboutView />;
}
