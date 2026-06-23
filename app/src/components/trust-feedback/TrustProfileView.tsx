"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Card,
  ModuleCard,
  ListRow,
  StatusPill,
  StatBlock,
  Avatar,
  EmptyState,
  SkeletonBlock,
  Icon,
  notify,
} from "@/components/shared";
import { TrustProfileHeader } from "./TrustProfileHeader";
import { TrustScoreRing } from "./TrustScoreRing";
import { TrustExplanationLink } from "./TrustExplanationLink";
import { ReputationTrend } from "./ReputationTrend";
import { BadgeWall } from "./BadgeWall";
import { FeedbackQualityPanel } from "./FeedbackQualityPanel";
import { TrustBreakdown } from "./TrustBreakdown";
import {
  useTrustProfileAggregate,
  type TrustDimension,
} from "@/lib/queries/trust-feedback";
import { useSession } from "@/lib/queries/session";
import type { Tone } from "@/lib/types";

/*
  PAGE-040 用户信任档案页（/u/:login）+ PAGE-041 解释面（抽屉，深链 ?explain=trust）。
  公开匿名可看（INV-04）。HARD-03：信任分始终可达拆解（COMP-118 入口 + COMP-111 抽屉）。
  INV-10：反馈质量区高于社交认可区（DOM/视觉权重）。脱敏只读（INV-04）；无经济元素（DEC-007）。
*/
const RULES_LINK = "/about#trust-rules"; // IA-013 公开评分规则（NFR-004）

/** 四类来源 → 环形分段令牌色（举报为扣分以 danger）。 */
const SOURCE_TONE: Record<TrustDimension["key"], Tone> = {
  exchange: "primary",
  feedback: "accent",
  github: "info",
  report: "danger",
  badge: "success",
};

export function TrustProfileView({ login }: { login: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const explainOpen = searchParams.get("explain") === "trust";

  const { data, isLoading, isError, refetch } = useTrustProfileAggregate(login);
  const { data: session } = useSession();
  const isAuthenticated = !!session;

  const openExplain = () => {
    const sp = new URLSearchParams(searchParams.toString());
    sp.set("explain", "trust");
    router.push(`/u/${login}?${sp.toString()}`);
  };
  const closeExplain = () => {
    const sp = new URLSearchParams(searchParams.toString());
    sp.delete("explain");
    const qs = sp.toString();
    router.push(qs ? `/u/${login}?${qs}` : `/u/${login}`);
  };

  if (isLoading) {
    return <SkeletonBlock variant="card" count={3} />;
  }

  if (isError || !data) {
    return (
      <EmptyState
        icon="person"
        title="该 GitHub 用户尚未加入 Know-share"
        description="未找到该贡献者的公开信任档案。"
        action={{ label: "去信任网络发现可信贡献者", href: "/trust" }}
        secondaryAction={{ label: "重试", onClick: () => refetch() }}
      />
    );
  }

  const isNewUser = data.level === "new" && data.score === 0;
  const segments =
    data.dimensions.length > 0
      ? data.dimensions.map((d) => ({
          label: d.label,
          value: Math.abs(parseInt(d.valueOrShare.replace(/[^\d-]/g, ""), 10) || 0),
          tone: SOURCE_TONE[d.key],
        }))
      : undefined;

  const ringSummary = `信任分 ${data.score}，满分 ${data.maxScore}，等级 ${data.tierLabel}`;
  const trendSummary =
    data.trend.length > 1
      ? `近 ${data.trend.length} 期信用分由 ${data.trend[0].score} 变为 ${data.trend[data.trend.length - 1].score}`
      : "暂无足够趋势数据";

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <TrustProfileHeader
          avatarUrl={data.avatarUrl}
          displayName={data.displayName}
          githubLogin={data.login}
          verified={data.verified}
          bio={data.bio}
          topics={data.topics}
          joinedDate={data.joinedDate}
          githubUrl={data.githubUrl}
          isSelf={data.isSelf}
          isAuthenticated={isAuthenticated}
          restrictionState={data.restrictionState}
          onSelfManageClick={() => router.push("/settings")}
          onReportUser={() => notify("举报已提交，平台将进行审核。", "success")}
          onRequireAuth={() => notify("请先使用 GitHub 登录后再继续。", "info")}
        />
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* 信任分圆环 + 解释入口（HARD-03 入口不可缺失） */}
        <Card>
          <h2 className="mb-3 text-base font-semibold text-text">信任分</h2>
          <TrustScoreRing
            score={data.score}
            maxScore={data.maxScore}
            tierLabel={data.tierLabel}
            segments={segments}
            textSummary={ringSummary}
            explanationAvailable={data.explanationAvailable}
            isNewUser={isNewUser}
            onExplain={openExplain}
          />
          <div className="mt-3 flex justify-center">
            <TrustExplanationLink
              githubLogin={data.login}
              explanationAvailable={data.explanationAvailable}
              onOpen={openExplain}
            />
          </div>
        </Card>

        {/* 关键指标 StatBlock 行 */}
        <Card className="lg:col-span-2">
          <h2 className="mb-3 text-base font-semibold text-text">关键指标</h2>
          {data.stats.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {data.stats.map((s) => (
                <StatBlock key={s.key} value={s.value} label={s.label} icon={s.icon} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-muted">信任随交换与反馈积累，暂无指标。</p>
          )}
          <div className="mt-5">
            <h3 className="mb-1 text-sm font-medium text-text-muted">声誉趋势</h3>
            <ReputationTrend series={data.trend} textSummary={trendSummary} compact />
          </div>
        </Card>
      </div>

      {/* 反馈质量（INV-10：DOM 上位于社交认可之前/权重更高） */}
      <Card>
        <FeedbackQualityPanel
          dimensionAverages={data.feedbackAverages}
          recentFeedback={data.recentFeedback}
          onAuthorClick={(handle) => router.push(`/u/${handle}`)}
          onExchangeLinkClick={(id) => router.push(`/exchanges/${id}`)}
        />
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* 已发布模块 */}
        <Card>
          <h2 className="mb-3 text-base font-semibold text-text">已发布模块</h2>
          {data.publishedModules.length > 0 ? (
            <div className="flex flex-col gap-3">
              {data.publishedModules.map((m) => (
                <ModuleCard
                  key={m.id}
                  module={m}
                  href={`/modules/${m.id}`}
                  variant="list"
                  owner={{ login: data.login, avatarUrl: data.avatarUrl, verified: data.verified }}
                />
              ))}
            </div>
          ) : (
            <EmptyState icon="inventory_2" title="尚无已发布模块" description="该贡献者还没有公开模块。" />
          )}
        </Card>

        {/* 交换历史（脱敏，INV-04） */}
        <Card>
          <h2 className="mb-3 text-base font-semibold text-text">交换历史</h2>
          {data.exchangeHistory.length > 0 ? (
            <ul className="overflow-hidden rounded-card border border-border">
              {data.exchangeHistory.map((e) => (
                <ListRow
                  key={e.exchangeId}
                  leading={
                    <Icon
                      name={e.direction === "outgoing" ? "swap_horiz" : "swap_horiz"}
                      size={18}
                      className="text-text-muted"
                      aria-label={e.direction === "outgoing" ? "发起的交换" : "被请求的交换"}
                    />
                  }
                  title={
                    <button
                      type="button"
                      onClick={() => router.push(`/exchanges/${e.exchangeId}`)}
                      className="text-sm text-text hover:text-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                    >
                      {e.moduleTitle}
                    </button>
                  }
                  subtitle={
                    <span className="text-xs text-text-subtle">
                      与{" "}
                      <button
                        type="button"
                        onClick={() => router.push(`/u/${e.peerHandle}`)}
                        className="text-primary underline focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                      >
                        @{e.peerHandle}
                      </button>{" "}
                      · {e.date}
                    </span>
                  }
                  meta={<StatusPill tone={e.statusTone as Tone} label={e.status} size="sm" />}
                />
              ))}
            </ul>
          ) : (
            <EmptyState icon="swap_horiz" title="尚无公开交换记录" description="完成的交换将脱敏展示于此。" />
          )}
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* 徽章墙 */}
        <Card>
          <h2 className="mb-3 text-base font-semibold text-text">徽章墙</h2>
          <BadgeWall badges={data.badges} />
        </Card>

        {/* 社交认可（明确低权重、视觉次于反馈质量区，INV-10） */}
        <Card>
          <h2 className="mb-1 text-base font-semibold text-text">社交认可</h2>
          <p className="mb-3 text-xs text-text-subtle">
            认可 / 关注为社交信号，权重低于实际交换参与方的反馈（INV-10）。
          </p>
          {data.social.endorsers.length > 0 || data.social.followerCount > 0 ? (
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {data.social.endorsers.map((e) => (
                  <Avatar key={e.login} src={e.avatarUrl} login={e.login} size="sm" />
                ))}
              </div>
              <span className="text-sm text-text-muted">
                {data.social.followerCount} 位关注者
              </span>
            </div>
          ) : (
            <p className="text-sm text-text-muted">暂无社交认可。</p>
          )}
        </Card>
      </div>

      {/* PAGE-041 信任分解释（抽屉，深链 ?explain=trust） */}
      <TrustBreakdown
        open={explainOpen}
        dimensions={data.dimensions}
        totalScore={data.score}
        maxScore={data.maxScore}
        trendAttribution={data.trendAttribution}
        rulesLink={RULES_LINK}
        isNewUser={isNewUser}
        explanationAvailable={data.explanationAvailable}
        onClose={closeExplain}
        onRulesLinkClick={() => router.push(RULES_LINK)}
      />
    </div>
  );
}
