"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Card,
  Icon,
  SecondaryButton,
  SkeletonBlock,
  StatusPill,
  EXCHANGE_STATUS_META,
  notify,
} from "@/components/shared";
import { ExchangeTimeline } from "./ExchangeTimeline";
import { ExchangeContentSummary } from "./ExchangeContentSummary";
import { ExchangeVerificationSummary } from "./ExchangeVerificationSummary";
import { ExchangePartyCard } from "./ExchangePartyCard";
import { ExchangeOwnerActions } from "./ExchangeOwnerActions";
import { ContactDisclosurePanel } from "./ContactDisclosurePanel";
import { PrivateDeliveryNote } from "./PrivateDeliveryNote";
import { ExchangeFeedbackSection } from "./ExchangeFeedbackSection";
import { FeedbackSurface } from "@/components/trust-feedback"; // COMP-116 单一真源（集成接线）
import {
  useAcceptExchange,
  useCancelExchange,
  useDiscloseContacts,
  useExchangeDetail,
  useMarkDelivered,
  useStartPreparing,
  useRejectExchange,
  useRevokeDisclosure,
} from "@/lib/queries/exchange";

/*
  ExchangeDetailView —— PAGE-031 交换详情客户端视图。
  两栏布局（左 2/3 时间线+内容摘要+验证摘要+反馈；右 1/3 参与方+状态+披露+交付+举报）。
  公开脱敏面任何访客可看；私域动作（披露/撤回/标记交付）仅登录的该次参与方可用（INV-03）。
  - 披露区门控仅 Accepted 后渲染真实联系方式（INV-03/DEC-010）。
  - 「在线沟通(IM)」仅对方披露 IM 后启用，平台不内置 IM（ASM-033/INV-01）。
  - 反馈区嵌入 trust-feedback COMP-116（本视图只做状态门控，不自建第二套表单）。
  守 INV-04：公开面零私有内容；DEC-007 无经济元素；NFR-007 状态有文字标签。
*/
export interface ExchangeDetailViewProps {
  exchangeId: string;
}

const PRIVATE_PREP_STATES = ["PrivatePreparing", "Delivered"];

export function ExchangeDetailView({ exchangeId }: ExchangeDetailViewProps) {
  const router = useRouter();
  const detailQuery = useExchangeDetail(exchangeId);
  const disclose = useDiscloseContacts(exchangeId);
  const revoke = useRevokeDisclosure(exchangeId);
  const markDelivered = useMarkDelivered(exchangeId);
  const startPreparing = useStartPreparing(exchangeId);
  const accept = useAcceptExchange(exchangeId);
  const reject = useRejectExchange(exchangeId);
  const cancel = useCancelExchange(exchangeId);

  if (detailQuery.isLoading) {
    return (
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <SkeletonBlock variant="card" count={3} />
        </div>
        <SkeletonBlock variant="card" count={2} />
      </div>
    );
  }

  if (detailQuery.isError || !detailQuery.data) {
    return (
      <div className="rounded-card border border-danger/30 bg-danger/5 p-6 text-center text-sm text-text-muted">
        <p className="mb-3">交换详情加载失败或不存在。</p>
        <SecondaryButton iconLeft="refresh" onClick={() => detailQuery.refetch()}>
          重试
        </SecondaryButton>
      </div>
    );
  }

  const d = detailQuery.data;
  const statusMeta = EXCHANGE_STATUS_META[d.status] ?? {
    tone: "neutral" as const,
    label: d.status,
  };
  const imEnabled =
    !!d.disclosure.peerDisclosure?.contacts.some((c) => c.type === "im");
  const isParticipant = d.viewerRole === "requester" || d.viewerRole === "owner";
  const canMarkDelivered = isParticipant && PRIVATE_PREP_STATES.includes(d.status);
  const canStartPreparing = isParticipant && d.status === "Accepted";

  return (
    <div className="space-y-6">
      {/* 面包屑 + 交换头 */}
      <header>
        <nav
          aria-label="面包屑"
          className="mb-3 flex items-center gap-2 text-sm text-text-muted"
        >
          <Link href="/exchanges" className="hover:text-primary">
            公开交换记录
          </Link>
          <Icon name="chevron_right" size={16} aria-hidden />
          <span className="font-medium text-text">交换详情</span>
        </nav>
        <h1 className="text-2xl font-semibold tracking-tight text-text">
          交换详情
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          交换编号：#{d.exchangeId} · 发起时间：{d.createdAt}
        </p>
      </header>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* 左栏 2/3 */}
        <div className="space-y-6 lg:col-span-2">
          <Card
            header={
              <h3 className="flex items-center gap-2 text-base font-semibold text-text">
                <Icon name="monitoring" size={18} aria-hidden className="text-primary" />
                交换进度
              </h3>
            }
          >
            <ExchangeTimeline steps={d.timeline} />
          </Card>

          <ExchangeContentSummary
            direction={d.direction}
            targetModule={d.targetModule}
            offeredModule={d.offeredModule}
          />

          <ExchangeVerificationSummary items={d.verification} />

          <ExchangeFeedbackSection
            exchangeStatus={d.status}
            viewerRole={d.viewerRole}
            windowState={d.feedbackWindow}
            renderFeedbackForm={() => (
              <FeedbackSurface exchangeId={exchangeId} />
            )}
          />
        </div>

        {/* 右栏 1/3 */}
        <aside className="space-y-6">
          <ExchangePartyCard
            requester={d.requester}
            target={d.target}
            onPartyClick={(login) => router.push(`/u/${login}`)}
          />

          {/* 当前状态卡 */}
          <Card>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold tracking-widest text-text-subtle uppercase">
                当前状态
              </span>
              <StatusPill
                tone={statusMeta.tone}
                label={statusMeta.label}
                icon={statusMeta.icon}
              />
            </div>
          </Card>

          {/* 交换操作（接受/拒绝/取消）：按 viewerRole + status 门控（FLOW-003） */}
          <ExchangeOwnerActions
            viewerRole={d.viewerRole}
            status={d.status}
            isAuthenticated={d.isAuthenticated}
            accepting={accept.isPending}
            rejecting={reject.isPending}
            cancelling={cancel.isPending}
            onAccept={async () => {
              await accept.mutateAsync();
            }}
            onReject={async (reason) => {
              await reject.mutateAsync(reason);
            }}
            onCancel={async (reason) => {
              await cancel.mutateAsync(reason);
            }}
          />

          <ContactDisclosurePanel
            exchangeStatus={d.status}
            viewerRole={d.viewerRole}
            isAuthenticated={d.isAuthenticated}
            myContacts={d.disclosure.myContacts}
            myDisclosure={d.disclosure.myDisclosure}
            peerDisclosure={d.disclosure.peerDisclosure}
            onDisclose={async (types) => {
              await disclose.mutateAsync(types);
            }}
            onRevoke={async () => {
              await revoke.mutateAsync();
            }}
          />

          <PrivateDeliveryNote
            channel={d.delivery.channel}
            channelLabel={d.delivery.channelLabel}
            deliveryHint={d.delivery.deliveryHint}
            canStartPreparing={canStartPreparing}
            canMarkDelivered={canMarkDelivered}
            imButtonEnabled={imEnabled}
            onStartPreparing={() => {
              startPreparing.mutate();
              notify("已进入私下准备阶段，可在平台外协调交付。", "success");
            }}
            onMarkDelivered={() => {
              markDelivered.mutate();
              notify("已记录你的交付确认，等待对方确认。", "success");
            }}
            onOpenIm={() => notify("请使用对方披露的 IM 账号在平台外沟通。", "info")}
          />

          <button
            type="button"
            onClick={() =>
              d.isAuthenticated
                ? notify("举报已提交，平台将进行审核。", "success")
                : notify("请先登录后再举报。", "info")
            }
            className="flex items-center gap-1 text-[11px] text-text-subtle hover:text-danger focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none rounded"
          >
            <Icon name="flag" size={12} aria-hidden />
            举报或申诉此交换
          </button>
        </aside>
      </div>
    </div>
  );
}
