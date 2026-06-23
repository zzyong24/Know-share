"use client";

import { useMemo, useState } from "react";
import {
  Card,
  PrimaryButton,
  SecondaryButton,
  Avatar,
  StatusPill,
  EmptyState,
  notify,
} from "@/components/shared";
import { useSession } from "@/lib/queries/session";
import {
  useReviewQueueAdmin,
  useReviewSummary,
  useReviewDetail,
  useAuditLog,
  useModerate,
  useBulkApprove,
  type ModerationAction,
  type AdminReviewItem,
} from "@/lib/queries/admin";
import { RiskSummaryRow } from "./risk-summary-row";
import { QueueFilterBar, type QueueFilterValue } from "./queue-filter-bar";
import { ReviewQueueTable } from "./review-queue-table";
import { ReviewDetailPanel } from "./review-detail-panel";
import { AuditLogList } from "./audit-log-list";
import { DestructiveConfirmDialog } from "./destructive-confirm-dialog";

/*
  COMP-170 AdminConsoleShell（审核控制台外壳与权限门）+ PAGE-080~085 装配。
  - 权限门：仅管理员（session.isAdmin）可见治理数据；非管理员渲染 403 拦截（不渲染任何队列/详情）。
  - 顶部风险摘要行（COMP-171）+ 两栏（队列 COMP-173 / 详情 COMP-176）+ 底部审计（COMP-180）。
  - 「批量通过」破坏性 → 二次确认（COMP-178），仅 pass 且无未决举报子集（INV-02/ASM-050），逐项写审计。
  - 处置写审计后失效队列/审计/摘要（INV-11）；失败 toast 报错、不视为成功（处置回滚）。
  - 不自动越过人工同意（产品边界第 3 条）。
*/
function applyFilter(
  items: AdminReviewItem[],
  filter: QueueFilterValue
): AdminReviewItem[] {
  return items.filter((i) => {
    if (filter.status === "risk" && i.gate === "pass") return false;
    if (filter.source !== "all" && i.kind !== filter.source) return false;
    return true;
  });
}

export function AdminConsole() {
  const { data: session, isLoading: sessionLoading } = useSession();
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const [filter, setFilter] = useState<QueueFilterValue>({
    status: "all",
    source: "all",
  });
  const [bulkOpen, setBulkOpen] = useState(false);

  const queue = useReviewQueueAdmin();
  const summary = useReviewSummary();
  const audit = useAuditLog();
  const detail = useReviewDetail(selectedId);
  const moderate = useModerate();
  const bulkApprove = useBulkApprove();

  const items = useMemo(() => queue.data?.items ?? [], [queue.data?.items]);
  const filtered = useMemo(() => applyFilter(items, filter), [items, filter]);
  const selectedItem = items.find((i) => i.id === selectedId);

  // 批量通过集合：仅 pass 且无未决举报（INV-02/ASM-050）
  const bulkIds = useMemo(
    () => items.filter((i) => i.gate === "pass" && !i.reported).map((i) => i.id),
    [items]
  );

  // 权限门（COMP-170）
  if (!sessionLoading && (!session || !session.isAdmin)) {
    return (
      <EmptyState
        icon="lock"
        title="无权访问"
        description="审核控制台仅管理员可用。"
        action={{ label: "返回发现页", href: "/" }}
      />
    );
  }

  const runModerate = async (action: ModerationAction, reason: string) => {
    if (!selectedId) return;
    try {
      await moderate.mutateAsync({ reviewItemId: selectedId, action, reason });
      notify("处置已记录", "success");
      setSelectedId(undefined);
    } catch {
      // 写审计失败 → 处置不视为成功（INV-11），UI 不前进
      notify("处置失败，请重试（未写入审计）", "error");
    }
  };

  const runBulkApprove = async () => {
    try {
      const res = await bulkApprove.mutateAsync(bulkIds);
      notify(`已批量通过 ${res.approved.length} 项`, "success");
      setBulkOpen(false);
    } catch {
      notify("批量通过失败，请重试", "error");
    }
  };

  const handleRefresh = () => {
    queue.refetch();
    summary.refetch();
    audit.refetch();
  };

  return (
    <main className="mx-auto flex max-w-[1280px] flex-col gap-6 px-4 py-6">
      {/* 标题 + 管理员标识徽 + 刷新 */}
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold text-text">审核控制台</h1>
          {session && (
            <span className="inline-flex items-center gap-1.5">
              <Avatar login={session.login} src={session.avatarUrl} size="xs" />
              <StatusPill tone="primary" label="管理员" icon="shield" size="sm" />
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <SecondaryButton
            size="sm"
            iconLeft="refresh"
            onClick={handleRefresh}
            aria-label="刷新列表"
          >
            刷新列表
          </SecondaryButton>
          <PrimaryButton
            size="sm"
            iconLeft="done_all"
            disabled={bulkIds.length === 0}
            onClick={() => setBulkOpen(true)}
          >
            批量通过（{bulkIds.length}）
          </PrimaryButton>
        </div>
      </header>

      {/* PAGE-080 风险摘要行 */}
      <RiskSummaryRow
        summary={summary.data}
        loading={summary.isLoading}
        onItemClick={(key) =>
          setFilter(
            key === "highRisk"
              ? { status: "risk", source: "all" }
              : key === "reportsToday"
                ? { status: "all", source: "report" }
                : { status: "all", source: "all" }
          )
        }
      />

      {/* 两栏：队列 + 详情 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <Card>
            <div className="mb-3">
              <QueueFilterBar
                value={filter}
                counts={{
                  all: items.length,
                  risk: items.filter((i) => i.gate !== "pass").length,
                  submission: items.filter((i) => i.kind === "submission").length,
                  report: items.filter((i) => i.kind === "report").length,
                }}
                onChange={setFilter}
              />
            </div>
            <ReviewQueueTable
              items={filtered}
              selectedId={selectedId}
              loading={queue.isLoading}
              onSelectRow={setSelectedId}
            />
          </Card>
        </div>
        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-24">
            <ReviewDetailPanel
              item={selectedItem}
              detail={detail.data}
              loading={detail.isLoading}
              busy={moderate.isPending}
              onModerate={runModerate}
            />
          </div>
        </div>
      </div>

      {/* PAGE-083 审计日志 */}
      <Card>
        <h2 className="mb-3 text-base font-semibold text-text">审计日志</h2>
        <AuditLogList
          entries={audit.data?.items ?? []}
          loading={audit.isLoading}
        />
      </Card>

      {/* PAGE-085 批量通过二次确认 */}
      <DestructiveConfirmDialog
        open={bulkOpen}
        action="bulk_approve"
        targetSummary={`将批量通过 ${bulkIds.length} 项隐私门通过且无未决举报的提交。`}
        impactText="已排除含警告 / 阻断或被举报的项；逐项写入审计。"
        requireReason={false}
        reason=""
        onReasonChange={() => {}}
        busy={bulkApprove.isPending}
        onConfirm={runBulkApprove}
        onCancel={() => setBulkOpen(false)}
        onOpenChange={setBulkOpen}
      />
    </main>
  );
}
