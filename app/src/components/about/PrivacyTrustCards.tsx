"use client";

import Link from "next/link";
import { Card } from "@/components/shared/card";
import { IconChip } from "@/components/shared/icon-chip";
import type { Tone } from "@/lib/types";

/*
  COMP-212 PrivacyTrustCards（PAGE-103）：三张说明卡——不托管原始内容 / 同意优先 / 信任如何积累。
  文案逐条可追溯（NFR-001/INV-01、NFR-005/INV-08、FR-050/ENT-011/INV-10），
  剔除真源 HTML 漂移主张——不出现「链上 / 不可篡改链上记录 / E2EE / 端到端加密 / 上传语义向量」。
  图标 aria-hidden，每卡有文字标题（图标非唯一信息载体，NFR-007）。
*/
export interface PrivacyTrustCardItem {
  icon: string;
  tone?: Tone;
  title: string;
  body: string;
  href?: string;
}

export interface PrivacyTrustCardsProps {
  cards?: PrivacyTrustCardItem[];
}

// 默认三卡：图标使用 icon-map 已映射的规范名（database_off/vitals 未映射，用等价 lock/monitoring）。
export const DEFAULT_PRIVACY_TRUST_CARDS: PrivacyTrustCardItem[] = [
  {
    icon: "lock",
    tone: "primary",
    title: "不托管原始内容",
    body: "平台只存脱敏清单与公开关系，你的原始笔记和文件始终留在你本地，平台不持有、不转存原始内容。",
  },
  {
    icon: "lock_open",
    tone: "info",
    title: "同意优先",
    body: "生成、提交、联系、交换前都有所有者明确同意门；私下交付走平台外通道（默认你的 GitHub 私有仓库），平台只记录交换关系。",
  },
  {
    icon: "monitoring",
    tone: "success",
    title: "信任如何积累",
    body: "信任由交换历史、结构化反馈、GitHub 验证与举报记录派生，且在页面上可解释；参与方的真实反馈权重高于社交信号。",
  },
];

export function PrivacyTrustCards({
  cards = DEFAULT_PRIVACY_TRUST_CARDS,
}: PrivacyTrustCardsProps) {
  return (
    <section
      id="privacy"
      aria-labelledby="about-privacy-title"
      className="border-t border-border py-12"
    >
      <h2 id="about-privacy-title" className="text-2xl font-semibold text-text">
        隐私与信任
      </h2>
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        {cards.map((card) => {
          const content = (
            <>
              <IconChip icon={card.icon} tone={card.tone ?? "primary"} size="lg" />
              <h3 className="mt-4 text-base font-semibold text-text">
                {card.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-text-muted">
                {card.body}
              </p>
            </>
          );
          if (card.href) {
            return (
              <Card key={card.title} className="transition-colors hover:border-primary">
                <Link
                  href={card.href}
                  className="block rounded-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  {content}
                </Link>
              </Card>
            );
          }
          return <Card key={card.title}>{content}</Card>;
        })}
      </div>
    </section>
  );
}
