import { OpenApiView } from "@/components/open-api";

/*
  PAGE-090 开放 API 文档页（route /developers，覆盖 IA-012 / ASM-054）。
  面向开发者与 agent 的公开 API 文档：零私有泄露承诺 + 分类导航 + 端点文档卡。
  公开可匿名访问（INV-04）；外壳由 (public)/layout.tsx 的 SiteShell 统一包裹。
  内容为静态文档配置（ASM-103），编排见 OpenApiView。
*/
export const metadata = {
  title: "开放 API 文档 · Know-share",
  description:
    "面向开发者与 AI Agent 的公开 API 文档：脱敏清单与聚合统计，零私有内容泄露。",
};

export default function DevelopersPage() {
  return <OpenApiView />;
}
