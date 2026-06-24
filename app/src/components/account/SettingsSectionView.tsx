"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { ConsentRecordList } from "./ConsentRecordList";
import { SettingsSubNav } from "./SettingsSubNav";
import {
  Avatar,
  StatusPill,
  PrimaryButton,
  SecondaryButton,
  ConfirmDialog,
  Icon,
  SkeletonBlock,
  notify,
} from "@/components/shared";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useConsents,
  useRevokeConsent,
  useAccountIdentity,
  useNotificationPrefs,
  useSaveNotificationPrefs,
  type NotificationPrefs,
} from "@/lib/queries/account";

/*
  SettingsSectionView —— PAGE-064 设置·隐私与同意 / 账户 / 通知偏好。
  三个分区主要由共享组件 + ConsentRecordList（all-consent 模式）组合（ASM-099）。
*/
export type SettingsSection = "privacy" | "account" | "notifications";

const VALID: SettingsSection[] = ["privacy", "account", "notifications"];

export function SettingsSectionView({ section }: { section: SettingsSection }) {
  const safe: SettingsSection = VALID.includes(section) ? section : "privacy";

  return (
    <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-6 px-4 py-6 md:flex-row">
      <aside className="md:w-64 md:shrink-0">
        <SettingsSubNav activeKey={safe} />
      </aside>
      <section className="flex max-w-[800px] flex-1 flex-col gap-6">
        {safe === "privacy" && <PrivacySection />}
        {safe === "account" && <AccountSection />}
        {safe === "notifications" && <NotificationPrefsSection />}
      </section>
    </div>
  );
}

// ── 隐私与同意：全量同意轨迹（ConsentRecordList all-consent 复用）──
function PrivacySection() {
  const consents = useConsents("all-consent");
  const revoke = useRevokeConsent();
  const [detailId, setDetailId] = useState<string | null>(null);
  const detail = consents.data?.items.find((r) => r.id === detailId) ?? null;

  return (
    <div>
      <h1 className="mb-1 text-lg font-semibold text-text">隐私与同意</h1>
      <p className="mb-4 text-sm text-text-muted">
        跨边界动作（生成 / 提交 / 联系 / 交换）的全量同意轨迹，可查看与撤回。
      </p>
      <ConsentRecordList
        records={consents.data?.items ?? []}
        loading={consents.isLoading}
        error={consents.isError}
        mode="all-consent"
        onRetry={() => consents.refetch()}
        onViewDetail={(id) => setDetailId(id)}
        onRevoke={(id) =>
          revoke.mutate(id, {
            onSuccess: () => {
              notify("已撤回（仅未来生效）。", "success");
              consents.refetch();
            },
          })
        }
      />

      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetailId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>同意详情</DialogTitle>
          </DialogHeader>
          {detail && (
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
              <dt className="text-text-muted">对象</dt>
              <dd className="text-text">@{detail.counterpartyHandle}</dd>
              <dt className="text-text-muted">披露内容</dt>
              <dd className="text-text">{detail.disclosedMethods.join("、")}</dd>
              <dt className="text-text-muted">时间</dt>
              <dd className="text-text">{detail.date}</dd>
              {detail.exchangeRef && (
                <>
                  <dt className="text-text-muted">关联交换</dt>
                  <dd className="text-text">{detail.exchangeRef}</dd>
                </>
              )}
              <dt className="text-text-muted">来源</dt>
              <dd className="text-text">{detail.source}</dd>
              <dt className="text-text-muted">可撤回</dt>
              <dd className="text-text">
                {detail.revoked
                  ? "已撤回"
                  : detail.revocable
                    ? "是（仅对未来生效）"
                    : "否"}
              </dd>
            </dl>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── 账户：GitHub 身份只读 + 退出登录 ──
function AccountSection() {
  const { data, isLoading } = useAccountIdentity();
  const [confirmLogout, setConfirmLogout] = useState(false);

  if (isLoading || !data) return <SkeletonBlock variant="card" />;

  return (
    <div>
      <h1 className="mb-4 text-lg font-semibold text-text">账户</h1>
      <div className="flex flex-col gap-4 rounded-card border border-border bg-surface p-4">
        <div className="flex items-center gap-3">
          <Avatar
            src={data.avatarUrl}
            login={data.githubHandle}
            verified={data.githubVerified}
            size="lg"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-text">
                @{data.githubHandle}
              </span>
              <StatusPill
                tone={data.githubVerified ? "success" : "neutral"}
                label={data.githubVerified ? "GitHub 已验证" : "未验证"}
                icon={data.githubVerified ? "verified" : "help"}
                size="sm"
              />
            </div>
            <p className="text-sm text-text-muted">
              {data.displayName} · 加入于 {data.joinedAt}
            </p>
          </div>
        </div>
        <p className="text-xs text-text-subtle">
          身份字段只读，不在平台修改 GitHub handle（DEC-006）。
        </p>
        <div className="flex gap-3">
          <a
            href="https://github.com/login/oauth"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            <Icon name="auto_awesome" size={16} aria-hidden />
            重新校验 GitHub 身份
          </a>
          <SecondaryButton
            size="sm"
            iconLeft="logout"
            onClick={() => setConfirmLogout(true)}
          >
            退出登录
          </SecondaryButton>
        </div>
      </div>

      <ConfirmDialog
        open={confirmLogout}
        title="退出登录？"
        description="退出后将返回匿名浏览态，需重新使用 GitHub 登录。"
        confirmLabel="退出登录"
        onOpenChange={setConfirmLogout}
        onCancel={() => setConfirmLogout(false)}
        onConfirm={() => {
          setConfirmLogout(false);
          void signOut({ callbackUrl: "/" });
        }}
      />
    </div>
  );
}

// ── 通知偏好：按类型开关站内通知 ──
const PREF_META: { key: keyof NotificationPrefs; label: string; desc: string }[] =
  [
    { key: "exchange", label: "交换", desc: "交换请求、接受/拒绝、交付状态。" },
    { key: "review", label: "评审", desc: "提交进入评审与评审结果。" },
    { key: "feedback", label: "反馈", desc: "反馈到期与收到的反馈。" },
    { key: "community", label: "社区", desc: "收藏、认可等社区事件。" },
  ];

function NotificationPrefsSection() {
  const { data, isLoading } = useNotificationPrefs();
  const save = useSaveNotificationPrefs();
  const [prefs, setPrefs] = useState<NotificationPrefs | null>(data ?? null);

  // data 异步到达时在渲染期同步，避免 effect 内 setState。
  const [prevData, setPrevData] = useState(data);
  if (prevData !== data) {
    setPrevData(data);
    if (data) setPrefs(data);
  }

  if (isLoading || !prefs) return <SkeletonBlock variant="card" />;

  return (
    <div>
      <h1 className="mb-1 text-lg font-semibold text-text">通知偏好</h1>
      <p className="mb-4 text-sm text-text-muted">
        按类型开关站内通知接收（邮件 / webhook 暂未开放）。
      </p>
      <div className="flex flex-col divide-y divide-border rounded-card border border-border bg-surface">
        {PREF_META.map((p) => {
          const on = prefs[p.key];
          return (
            <div
              key={p.key}
              className="flex items-center justify-between gap-3 p-4"
            >
              <div>
                <label
                  htmlFor={`pref-${p.key}`}
                  className="text-sm font-medium text-text"
                >
                  {p.label}
                </label>
                <p className="text-xs text-text-muted">{p.desc}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-text-muted">
                  {on ? "开启" : "关闭"}
                </span>
                <Switch
                  id={`pref-${p.key}`}
                  checked={on}
                  aria-label={`${p.label}通知：当前${on ? "开启" : "关闭"}`}
                  onCheckedChange={(checked) =>
                    setPrefs((prev) =>
                      prev ? { ...prev, [p.key]: checked } : prev
                    )
                  }
                />
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex justify-end">
        <PrimaryButton
          loading={save.isPending}
          onClick={() =>
            save.mutate(prefs, {
              onSuccess: () => notify("偏好已保存", "success"),
            })
          }
        >
          保存偏好
        </PrimaryButton>
      </div>
    </div>
  );
}
