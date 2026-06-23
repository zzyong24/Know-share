"use client";

import { Drawer, Icon } from "@/components/shared";
import { WeightDisclosureNote } from "./WeightDisclosureNote";
import type { TrustDimension } from "@/lib/queries/trust-feedback";
import { cn } from "@/lib/utils";

/*
  COMP-111 TrustBreakdown（可解释拆解）—— HARD-03 界面兑现核心。
  抽屉（复用 COMP-026 Drawer，深链 ?explain=trust）展开 ENT-011.解释：
  四类来源（交换历史 / 反馈质量 / GitHub 验证 / 举报扣分）+ 可选徽章加成，
  每项 维度名 + 方向（文字，非仅颜色）+ 分值/占比 + 一句话口径说明。
  含权重声明（COMP-119，不可移除，INV-10）+ 公开评分规则链接（NFR-004）。
  举报维度为中性聚合，不含举报方身份/细节（INV-04）。
  总分与 COMP-110 一致；不一致显示「数据刷新中」。
*/
const DIRECTION_META = {
  up: { icon: "trending_up", cls: "text-success", word: "提升" },
  down: { icon: "trending_down", cls: "text-danger", word: "扣分" },
  neutral: { icon: "trending_flat", cls: "text-text-muted", word: "中性" },
} as const;

export interface TrustBreakdownProps {
  open: boolean;
  dimensions: TrustDimension[];
  totalScore: number;
  maxScore?: number;
  trendAttribution?: string;
  rulesLink: string;
  isNewUser?: boolean;
  explanationAvailable?: boolean;
  /** 拆解汇总与圆环总分是否一致；false → 「数据刷新中」 */
  scoreConsistent?: boolean;
  onClose: () => void;
  onRulesLinkClick?: () => void;
}

export function TrustBreakdown({
  open,
  dimensions,
  totalScore,
  maxScore = 1000,
  trendAttribution,
  rulesLink,
  isNewUser = false,
  explanationAvailable = true,
  scoreConsistent = true,
  onClose,
  onRulesLinkClick,
}: TrustBreakdownProps) {
  return (
    <Drawer
      open={open}
      title="信任分如何形成"
      size="lg"
      onOpenChange={(o) => !o && onClose()}
    >
      <div className="flex flex-col gap-4">
        {!explanationAvailable ? (
          <p role="status" className="py-8 text-center text-sm text-text-muted">
            信任解释生成中…
          </p>
        ) : isNewUser ? (
          <p className="py-8 text-center text-sm text-text-muted">
            尚无足够交换与反馈，信任分以基础分起步，将随交换积累。
          </p>
        ) : !scoreConsistent ? (
          <p role="status" className="py-8 text-center text-sm text-text-muted">
            数据刷新中…
          </p>
        ) : (
          <>
            <p className="text-sm text-text-muted">
              当前信任分{" "}
              <span className="font-semibold tabular-nums text-text">
                {totalScore} / {maxScore}
              </span>{" "}
              由以下来源派生：
            </p>

            {/* 权重声明（INV-10，不可移除） */}
            <WeightDisclosureNote
              context="explanation"
              rulesLink={rulesLink}
              onRulesLinkClick={onRulesLinkClick}
            />

            <ul className="flex flex-col divide-y divide-border">
              {dimensions.map((d) => {
                const meta = DIRECTION_META[d.direction];
                return (
                  <li key={d.key} className="flex items-start gap-3 py-3">
                    <span className={cn("mt-0.5 inline-flex items-center gap-1 text-xs", meta.cls)}>
                      <Icon name={meta.icon} size={14} aria-hidden />
                      <span className="sr-only">{meta.word}</span>
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium text-text">{d.label}</span>
                        <span className={cn("text-sm tabular-nums", meta.cls)}>
                          {d.valueOrShare}
                          <span className="ml-1 text-[11px] text-text-subtle">
                            （{meta.word}）
                          </span>
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-text-muted">{d.explanation}</p>
                    </div>
                  </li>
                );
              })}
            </ul>

            {trendAttribution && (
              <p className="rounded-control bg-muted/50 p-2.5 text-xs text-text-muted">
                趋势归因：{trendAttribution}
              </p>
            )}

            <a
              href={rulesLink}
              onClick={onRulesLinkClick}
              className="inline-flex w-fit items-center gap-1 text-sm font-medium text-primary underline focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            >
              了解评分规则
              <Icon name="open_in_new" size={12} aria-hidden />
            </a>
          </>
        )}
      </div>
    </Drawer>
  );
}
