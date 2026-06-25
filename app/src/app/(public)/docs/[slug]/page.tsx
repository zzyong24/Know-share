import { notFound } from "next/navigation";
import Link from "next/link";
import type { ReactNode } from "react";

/*
  PAGE-105 关联：可审计产物文档（/docs/:slug）。(public) 段，匿名可访问（INV-04）。
  兑现 NFR-004：规则 / 隐私模型 / 数据契约可在平台内查阅（此前 AuditLinkRow 指向的 /docs/* 不存在 → 404）。
  纯静态内容，无 PII / 无私有内容；机读入口指向真实端点。
*/

interface DocDef {
  title: string;
  intro: string;
  body: ReactNode;
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold text-text">{title}</h2>
      <div className="mt-2 space-y-2 text-sm text-text-muted">{children}</div>
    </section>
  );
}

function Bullets({ items }: { items: ReactNode[] }) {
  return (
    <ul className="list-disc space-y-1 pl-5">
      {items.map((it, i) => (
        <li key={i}>{it}</li>
      ))}
    </ul>
  );
}

const DOCS: Record<string, DocDef> = {
  rules: {
    title: "可审计规则",
    intro:
      "平台对提交、隐私门与审核的规则公开可查；关键动作均写审计日志（INV-11）。",
    body: (
      <>
        <Section title="隐私门（HARD-01，本机 + 服务端双校验）">
          <p>清单在本机生成时先扫描，平台在提交/上传时再服务端复核（INV-02：block 不可绕过）：</p>
          <Bullets
            items={[
              "block：检出真实凭据/密钥模式（如 key:值、ghp_… token、私钥块）→ 拒绝，不落库。",
              "warn：检出邮箱 / 本地路径 / 私有 URL / 过长原文摘录 → 需显式确认。",
              "pass：仅脱敏元数据，放行建 Draft。",
            ]}
          />
          <p>命中的原始片段绝不回显，findings 仅指向字段（INV-01）。</p>
        </Section>
        <Section title="审核与处置">
          <Bullets
            items={[
              "提交经隐私门后进入评审队列；管理员可 approve（发布）/ return（退回修改）/ delist（下架）。",
              "block 态的提交无法被 approve 发布（INV-02）。",
              "处置原因必填，全部写审计日志（INV-11）。",
              "写操作受速率限制（NFR-006）。",
            ]}
          />
        </Section>
        <Section title="机读">
          <p>
            规则对应的契约见{" "}
            <Link href="/developers" className="text-primary hover:underline">
              开放 API 文档
            </Link>{" "}
            与{" "}
            <Link href="/api/manifest-schema" className="text-primary hover:underline">
              /api/manifest-schema
            </Link>
            。
          </p>
        </Section>
      </>
    ),
  },
  "privacy-model": {
    title: "隐私模型",
    intro:
      "Know-share 隐私优先：平台做撮合与信任，原始知识内容永不经手。",
    body: (
      <>
        <Section title="三条产品边界">
          <Bullets
            items={[
              "不托管原始知识内容（INV-01）：平台只存脱敏清单 manifest 与公开关系，绝不存原文。",
              "无经济模型（DEC-007）：无付费 / 计费 / 交易，仅知识互换与信任。",
              "不自动越过人类同意（NFR-005）：发布、披露联系方式、发起/完成交换都需本人确认。",
            ]}
          />
        </Section>
        <Section title="联系方式与披露">
          <Bullets
            items={[
              "联系方式默认私密（DEC-010），公开为显式 opt-in。",
              "仅交换被 Accepted 后，才对该次对方披露（INV-03）；旁观者零泄漏。",
              "撤回只影响未来披露，已披露快照不收回（ASM-013）。",
            ]}
          />
        </Section>
        <Section title="公开面与统计">
          <Bullets
            items={[
              "公开页与开放 API 零私有内容（INV-04）：不返回 contact / 私有 URL / 原文。",
              "平台统计为聚合计数、无 PII（INV-09）。",
            ]}
          />
        </Section>
        <Section title="实际交换">
          <p>
            真正的知识交付走平台外的私有通道（默认 GitHub 私有仓库，ASM-007）：所有者把对方邀请进私有仓库交付，平台只记录关系、状态与反馈，不经手内容。
          </p>
        </Section>
      </>
    ),
  },
  "data-contract": {
    title: "数据契约",
    intro:
      "对 agent 友好的机读契约：脱敏清单规范 + 公开读端点，零私有泄露。",
    body: (
      <>
        <Section title="清单规范 know-share-manifest@1">
          <p>提交/上传的清单为脱敏元数据，核心字段：</p>
          <Bullets
            items={[
              "title / summary / topics / tags / language",
              "source_types / source_stats / freshness / sensitivity",
              "covered_questions / redaction_notes / version / updated_at",
              "绝不含 contact / 原始内容 / 私有路径 / 凭据（strict 校验，多余键即拒）。",
            ]}
          />
        </Section>
        <Section title="机读入口（agent 进站即自配置）">
          <Bullets
            items={[
              <Link key="schema" href="/api/manifest-schema" className="text-primary hover:underline">/api/manifest-schema（清单 JSON Schema）</Link>,
              <Link key="openapi" href="/api/openapi.json" className="text-primary hover:underline">/api/openapi.json（端点规格）</Link>,
              <Link key="llms" href="/llms.txt" className="text-primary hover:underline">/llms.txt（站点机读说明）</Link>,
            ]}
          />
        </Section>
        <Section title="公开读端点（脱敏 / 聚合）">
          <Bullets
            items={[
              "GET /api/modules、/api/modules/:id —— 脱敏清单",
              "GET /api/exchanges —— 公开交换台账（不含内容）",
              "GET /api/stats —— 平台聚合统计（无 PII）",
            ]}
          />
          <p>
            完整文档见{" "}
            <Link href="/developers" className="text-primary hover:underline">
              开放 API 文档
            </Link>
            。
          </p>
        </Section>
      </>
    ),
  },
};

export function generateStaticParams() {
  return Object.keys(DOCS).map((slug) => ({ slug }));
}

// 仅这三篇为有效路由；其它 slug → 真 404（而非渲染空壳）。
export const dynamicParams = false;

export default async function DocsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const doc = DOCS[slug];
  if (!doc) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <nav className="mb-4 text-sm text-text-muted">
        <Link href="/about" className="hover:text-primary">
          关于
        </Link>
        <span className="px-2">/</span>
        <span className="text-text">可审计产物</span>
      </nav>
      <h1 className="text-2xl font-bold tracking-tight text-text">{doc.title}</h1>
      <p className="mt-2 text-sm text-text-muted">{doc.intro}</p>
      {doc.body}
    </div>
  );
}
