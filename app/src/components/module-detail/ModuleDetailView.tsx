"use client";

/*
  详情页客户端容器（PAGE-010 装配）。取数走 useModuleDetail（TanStack Query），
  把 ModuleDetail 拆给 COMP-050~056；登录引导 / 收藏 / 举报等动作在此编排（占位）。
  加载态用 Skeleton 不闪烁原始内容；404 走 NotFound 分支。
*/
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ConfirmDialog,
  SkeletonBlock,
  notify,
} from "@/components/shared";
import { useModuleDetail } from "@/lib/queries/module-detail";
import { useFavoriteModule, useEndorseUser, useReport } from "@/lib/queries/community";
import { useCreateExchange } from "@/lib/queries/exchange";
import { ModuleDetailLayout } from "./ModuleDetailLayout";
import { ModuleSummaryHeader } from "./ModuleSummaryHeader";
import { SourceStatsPanel } from "./SourceStatsPanel";
import { PrivacyBoundaryCard } from "./PrivacyBoundaryCard";
import { ManifestPreview } from "./ManifestPreview";
import { TrustSignalAside } from "./TrustSignalAside";
import { RequestExchangeCTA } from "./RequestExchangeCTA";

const AUDIT_RULES_URL = "https://github.com/know-share/rules#privacy";

export interface ModuleDetailViewProps {
  moduleId: string;
  /** 当前登录态（默认匿名；PAGE-001/INV-04）。 */
  isAuthenticated?: boolean;
  /** 当前用户 handle（用于判断 owner 自看）。 */
  currentUser?: string;
}

export function ModuleDetailView({
  moduleId,
  isAuthenticated = false,
  currentUser,
}: ModuleDetailViewProps) {
  const router = useRouter();
  const { data, isLoading, isError } = useModuleDetail(moduleId);

  const [favorited, setFavorited] = useState(false);
  const [endorsed, setEndorsed] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  // 写动作接线（DEC-018）：收藏 / 认可 / 举报 / 发起交换走真实 mutation（MSW mock 可用）。
  const favorite = useFavoriteModule(moduleId);
  const ownerHandle = data?.owner.handle ?? "";
  const endorse = useEndorseUser(ownerHandle);
  const report = useReport();
  const createExchange = useCreateExchange();

  const requireLogin = () =>
    notify("请先用 GitHub 登录后再操作", "info");

  // 收藏：乐观切换本地态 + 提交 mutation；失败回滚并提示。
  const handleToggleFavorite = () => {
    const nextFavorited = !favorited;
    setFavorited(nextFavorited);
    favorite.mutate(
      { toggle: true },
      {
        onError: () => {
          setFavorited(!nextFavorited);
          notify("操作失败，请稍后重试。", "error");
        },
      }
    );
  };

  // 认可：乐观切换 + 提交 mutation；失败回滚。
  const handleToggleEndorse = () => {
    const nextEndorsed = !endorsed;
    setEndorsed(nextEndorsed);
    endorse.mutate(undefined, {
      onError: () => {
        setEndorsed(!nextEndorsed);
        notify("操作失败，请稍后重试。", "error");
      },
    });
  };

  // 发起交换：触发创建（API-019）；成功后跳交换详情，沿用现有 UI 流（最小改动）。
  const handleRequestExchange = () => {
    createExchange.mutate(
      { targetModuleId: moduleId },
      {
        onSuccess: (res) => {
          notify("已发起交换请求，等待对方确认。", "success");
          router.push(`/exchanges/${res.exchangeId}`);
        },
        onError: () => notify("发起交换失败，请稍后重试。", "error"),
      }
    );
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="flex flex-1 flex-col gap-6">
          <SkeletonBlock variant="text" count={2} />
          <SkeletonBlock variant="card" />
          <SkeletonBlock variant="card" />
        </div>
        <div className="w-full lg:w-80">
          <SkeletonBlock variant="card" />
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <ModuleDetailLayout
        lifecycleState="NotFound"
        isOwnerViewing={false}
        slots={{
          header: null,
          sourceStats: null,
          manifest: null,
          privacy: null,
          sidebar: null,
        }}
      />
    );
  }

  const { module, owner, trust, privacy, fullManifest, lifecycleState } = data;
  const isOwnerViewing = !!currentUser && currentUser === owner.handle;

  const stats = [
    {
      icon: "fact_check",
      label: "覆盖问题",
      value: fullManifest.covered_questions.length,
    },
    { icon: "label", label: "主题数", value: module.topics.length },
    { icon: "swap_horiz", label: "交换次数", value: module.exchangeCount },
    { icon: "favorite", label: "收藏数", value: module.favoriteCount },
  ];

  return (
    <>
      <ModuleDetailLayout
        lifecycleState={lifecycleState}
        isOwnerViewing={isOwnerViewing}
        slots={{
          header: (
            <ModuleSummaryHeader
              title={module.title}
              summary={module.summary}
              ownerHandle={owner.handle}
              githubVerified={owner.githubVerified}
              topics={module.topics}
              updatedAt={module.freshness}
              isAuthenticated={isAuthenticated}
              socialState={{ favorited, endorsed, rateLimited: false }}
              isOwnerViewing={isOwnerViewing}
              onToggleFavorite={handleToggleFavorite}
              onToggleEndorse={handleToggleEndorse}
              onReport={() => setReportOpen(true)}
              onCopyDeepLink={() =>
                navigator.clipboard?.writeText(
                  `${location.origin}/modules/${module.id}`
                )
              }
              onTopicClick={(t) => router.push(`/?topic=${encodeURIComponent(t)}`)}
              onRequireLogin={requireLogin}
            />
          ),
          sourceStats: (
            <SourceStatsPanel
              sourceTypes={fullManifest.source_types}
              stats={stats}
              freshness={module.freshness}
            />
          ),
          manifest: <ManifestPreview manifest={fullManifest} />,
          privacy: (
            <PrivacyBoundaryCard
              sensitivity={privacy.sensitivity}
              privacyGate={privacy.gate}
              gateExplanation={privacy.gateExplanation}
              redactionNotes={privacy.redactionNotes}
              contentCommitment={privacy.contentCommitment}
              auditRulesUrl={AUDIT_RULES_URL}
              isAuthenticated={isAuthenticated}
              onReport={() => setReportOpen(true)}
              onRequireLogin={requireLogin}
            />
          ),
          sidebar: (
            <>
              <TrustSignalAside
                owner={owner}
                trustLevel={trust.level}
                trustExplanation={trust.explanation}
                socialCounts={{
                  favorites: trust.favorites,
                  endorsements: trust.endorsements,
                }}
                hasTrustHistory={module.exchangeCount > 0}
                onOpenProfile={() => router.push(`/u/${owner.handle}`)}
              />
              <RequestExchangeCTA
                moduleId={module.id}
                exchangeIntent={fullManifest.exchange_intent}
                isAuthenticated={isAuthenticated}
                isOwnerViewing={isOwnerViewing}
                onRequestExchange={handleRequestExchange}
                onRequireLogin={requireLogin}
              />
            </>
          ),
        }}
      />

      <ConfirmDialog
        open={reportOpen}
        title="举报该模块"
        description="举报将提交人工复核并写入审计日志（受速率限制）。确定继续吗？"
        confirmLabel="提交举报"
        tone="danger"
        onConfirm={() => {
          setReportOpen(false);
          report.mutate(
            { targetType: "module", targetId: moduleId, reason: "用户从模块详情页提交举报" },
            {
              onSuccess: () =>
                notify("举报已提交，将进入人工复核", "success"),
              onError: () => notify("举报提交失败，请稍后重试。", "error"),
            }
          );
        }}
        onCancel={() => setReportOpen(false)}
        onOpenChange={setReportOpen}
      />
    </>
  );
}
