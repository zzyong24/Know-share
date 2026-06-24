"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  FormField,
  VisibilityToggle,
  StatusPill,
  PrimaryButton,
  SecondaryButton,
  ConfirmDialog,
  IconChip,
  SkeletonBlock,
  notify,
} from "@/components/shared";
import { Input } from "@/components/ui/input";
import type { ContactVisibility, Tone } from "@/lib/types";
import type { ContactMethod } from "@/lib/queries/account";

/*
  COMP-155 ContactMethodsForm（联系方式表单，PAGE-063）。
  默认私密强约束（INV-03）：任何渠道默认 private；切「公开」是显式 opt-in，保存时必须确认，
  无「静默公开」路径。邮箱格式校验 + 脱敏展示；GitHub handle 格式校验。
  保存成功 toast「设置已保存」（写 Consent/AuditLog 由服务侧 INV-08/11）。
*/

const schema = z.object({
  github: z
    .string()
    .trim()
    .regex(/^@?[A-Za-z0-9-]{1,39}$/, "请输入合法的 GitHub handle（如 @name）"),
  email: z
    .string()
    .trim()
    .regex(/^[^@\s]+@[^@\s]+\.[^@\s]+$/, "请输入合法的邮箱地址"),
});

type FormValues = z.infer<typeof schema>;

const STATUS_TONE: Record<string, { tone: Tone; label: string }> = {
  private: { tone: "neutral", label: "Private" },
  public: { tone: "success", label: "Public" },
  unset: { tone: "warning", label: "Not Set" },
};

export interface ContactMethodsFormProps {
  contactMethods: ContactMethod[];
  loading?: boolean;
  saving?: boolean;
  onSave?: (
    methods: ContactMethod[],
    values: FormValues
  ) => void | Promise<void>;
  onCancel?: () => void;
}

export function ContactMethodsForm({
  contactMethods,
  loading = false,
  saving = false,
  onSave,
  onCancel,
}: ContactMethodsFormProps) {
  // 可见性本地态：默认严格取 fixture（默认 private，INV-03）。
  const buildVisibility = () =>
    Object.fromEntries(
      contactMethods.map((m) => [m.id, m.visibility])
    ) as Record<string, ContactVisibility>;
  const [visibility, setVisibility] =
    useState<Record<string, ContactVisibility>>(buildVisibility);
  const [confirmPublic, setConfirmPublic] = useState(false);
  const [dirty, setDirty] = useState(false);
  // 自定义渠道「立即关联」：内联输入账号/链接（默认私密，INV-03）。
  const [linkOpen, setLinkOpen] = useState(false);
  const [customValue, setCustomValue] = useState("");

  // contactMethods 引用变化（异步到达/刷新）时在渲染期同步，避免 effect 内 setState。
  const [prevMethods, setPrevMethods] = useState(contactMethods);
  if (prevMethods !== contactMethods) {
    setPrevMethods(contactMethods);
    setVisibility(buildVisibility());
  }

  const github = contactMethods.find((m) => m.type === "github");
  const email = contactMethods.find((m) => m.type === "email");
  const custom = contactMethods.find((m) => m.type === "custom");

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    // values 随数据到达同步（defaultValues 仅在 mount 捕获，异步取数会丢值）。
    values: {
      github: github?.maskedValue ?? "",
      email: email?.maskedValue ?? "",
    },
    mode: "onSubmit",
  });

  const goingPublic = useMemo(
    () =>
      contactMethods.some(
        (m) => m.visibility !== "public" && visibility[m.id] === "public"
      ),
    [contactMethods, visibility]
  );

  function toggleVisibility(id: string, to: ContactVisibility) {
    setVisibility((v) => ({ ...v, [id]: to }));
    setDirty(true);
  }

  function buildMethods(): ContactMethod[] {
    const values = getValues();
    return contactMethods.map((m) => {
      // 自定义渠道：已输入关联值则置 isSet + 默认私密。
      if (m.type === "custom" && customValue.trim()) {
        return {
          ...m,
          isSet: true,
          visibility: visibility[m.id] ?? "private",
          maskedValue: customValue.trim(),
        };
      }
      return {
        ...m,
        visibility: visibility[m.id] ?? "private",
        maskedValue:
          m.type === "github"
            ? values.github
            : m.type === "email"
              ? values.email
              : m.maskedValue,
      };
    });
  }

  async function persist() {
    await onSave?.(buildMethods(), getValues());
    setDirty(false);
    notify("设置已保存", "success");
  }

  // 提交：切 public 必须二次确认（显式 opt-in，INV-03）。
  const onSubmit = handleSubmit(async () => {
    if (goingPublic) {
      setConfirmPublic(true);
      return;
    }
    await persist();
  });

  if (loading) {
    return <SkeletonBlock variant="card" count={2} />;
  }

  function statusFor(m: ContactMethod) {
    if (!m.isSet) return STATUS_TONE.unset;
    return STATUS_TONE[visibility[m.id] ?? "private"];
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <div className="overflow-hidden rounded-card border border-border bg-surface">
        <div className="border-b border-border px-4 py-3">
          <h2 className="text-base font-semibold text-text">主要联系渠道</h2>
        </div>

        {/* GitHub */}
        {github && (
          <div className="flex flex-col gap-3 border-b border-border p-4">
            <div className="flex items-center gap-3">
              <IconChip icon={github.icon} tone="primary" size="md" />
              <span className="font-medium text-text">{github.label}</span>
              {(() => {
                const s = statusFor(github);
                return <StatusPill tone={s.tone} label={s.label} size="sm" />;
              })()}
            </div>
            <FormField
              label="GitHub handle"
              hint="须与登录身份一致，不可冒用他人 handle。"
              error={errors.github?.message}
              renderControl={(p) => (
                <Input
                  {...p}
                  {...register("github")}
                  onInput={() => setDirty(true)}
                  aria-describedby={p["aria-describedby"]}
                />
              )}
            />
            <VisibilityToggle
              label="设为公开"
              value={visibility[github.id] ?? "private"}
              onChange={(to) => toggleVisibility(github.id, to)}
              disclosurePolicyHint="默认私密；仅在交换被接受后对该次对方披露。"
            />
          </div>
        )}

        {/* Email */}
        {email && (
          <div className="flex flex-col gap-3 border-b border-border p-4">
            <div className="flex items-center gap-3">
              <IconChip icon={email.icon} tone="info" size="md" />
              <span className="font-medium text-text">{email.label}</span>
              {(() => {
                const s = statusFor(email);
                return <StatusPill tone={s.tone} label={s.label} size="sm" />;
              })()}
            </div>
            <FormField
              label="邮箱"
              hint="展示时脱敏（如 z****@example.com）。"
              error={errors.email?.message}
              renderControl={(p) => (
                <Input
                  {...p}
                  {...register("email")}
                  onInput={() => setDirty(true)}
                  aria-describedby={p["aria-describedby"]}
                />
              )}
            />
            <VisibilityToggle
              label="设为公开"
              value={visibility[email.id] ?? "private"}
              onChange={(to) => toggleVisibility(email.id, to)}
            />
          </div>
        )}

        {/* Custom（未设态）：内联关联输入 */}
        {custom && (
          <div className="flex flex-col gap-3 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <IconChip icon={custom.icon} tone="neutral" size="md" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-text">{custom.label}</span>
                    {(() => {
                      const s = statusFor(custom);
                      return (
                        <StatusPill tone={s.tone} label={s.label} size="sm" />
                      );
                    })()}
                  </div>
                  <p className="text-sm text-text-muted">
                    {customValue.trim() || custom.maskedValue}
                  </p>
                </div>
              </div>
              {!linkOpen && (
                <SecondaryButton
                  size="sm"
                  iconLeft="add"
                  onClick={() => setLinkOpen(true)}
                >
                  立即关联
                </SecondaryButton>
              )}
            </div>
            {linkOpen && (
              <div className="flex items-center gap-2">
                <Input
                  value={customValue}
                  onChange={(e) => setCustomValue(e.target.value)}
                  placeholder="输入该渠道账号或链接（默认私密）"
                  aria-label={`关联 ${custom.label}`}
                />
                <PrimaryButton
                  size="sm"
                  disabled={saving}
                  onClick={async () => {
                    if (!customValue.trim()) {
                      notify("请输入要关联的账号或链接。", "error");
                      return;
                    }
                    setDirty(true);
                    await persist();
                    setLinkOpen(false);
                  }}
                >
                  保存关联
                </PrimaryButton>
                <SecondaryButton
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setLinkOpen(false);
                    setCustomValue("");
                  }}
                >
                  取消
                </SecondaryButton>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3 border-t border-border pt-4">
        <SecondaryButton
          onClick={() => {
            if (dirty) {
              setDirty(false);
            }
            onCancel?.();
          }}
        >
          取消
        </SecondaryButton>
        <PrimaryButton type="submit" loading={saving} disabled={!dirty && !saving}>
          保存设置
        </PrimaryButton>
      </div>

      {/* 公开 opt-in 二次确认（INV-03：无静默公开路径） */}
      <ConfirmDialog
        open={confirmPublic}
        title="确认公开联系方式？"
        description="公开后任何人都可见你选择公开的联系方式。这是显式操作，可随时改回私密。"
        confirmLabel="确认公开并保存"
        onOpenChange={setConfirmPublic}
        onCancel={() => setConfirmPublic(false)}
        onConfirm={async () => {
          setConfirmPublic(false);
          await persist();
        }}
      />
    </form>
  );
}
