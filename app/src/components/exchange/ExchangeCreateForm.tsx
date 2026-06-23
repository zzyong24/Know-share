"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Card,
  FormField,
  Icon,
  PrimaryButton,
  SecondaryButton,
  SkeletonBlock,
  TopicChip,
  notify,
} from "@/components/shared";
import { Textarea } from "@/components/ui/textarea";
import {
  useCreateExchange,
  useExchangeTargetModule,
  useMyPublishedModules,
} from "@/lib/queries/exchange";

/*
  COMP-100 ExchangeCreateForm（互惠创建交换表单，PAGE-031b /exchanges/new）。
  - 目标模块只读展示（?module=<id> 预填，公开脱敏摘要 INV-04）。
  - 可选 offeredModule（互惠，从我的已发布模块选；不选 = 单向请求 DEC-009/INV-05）。
  - 留言（可选）+ 同意勾选（INV-08，必勾，否则 422）。rhf + zod 校验。
  提交 → useCreateExchange → 成功跳 /exchanges/:id + toast；缺 consent → 后端 422 提示。
  无经济元素（DEC-007）。
*/
export interface ExchangeCreateFormProps {
  targetModuleId: string;
}

const schema = z.object({
  offeredModuleId: z.string().optional(),
  message: z.string().trim().max(500, "留言不超过 500 字").optional(),
  consent: z.boolean().refine((v) => v === true, {
    message: "请勾选同意后再发起交换。",
  }),
});

type FormValues = z.input<typeof schema>;

export function ExchangeCreateForm({ targetModuleId }: ExchangeCreateFormProps) {
  const router = useRouter();
  const targetQuery = useExchangeTargetModule(targetModuleId);
  const myModulesQuery = useMyPublishedModules();
  const createExchange = useCreateExchange();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { offeredModuleId: "", message: "", consent: false },
    mode: "onSubmit",
  });

  const myModules = myModulesQuery.data ?? [];

  const onSubmit = handleSubmit((values) => {
    createExchange.mutate(
      {
        targetModuleId,
        offeredModuleId: values.offeredModuleId || undefined,
      },
      {
        onSuccess: (res) => {
          notify("已发起交换请求，等待对方确认。", "success");
          router.push(`/exchanges/${res.exchangeId}`);
        },
        onError: (err) => {
          // 缺 consent → 后端 422；前端 zod 已先拦截，这里兜底网络/校验错误。
          const msg =
            err instanceof Error && /422/.test(err.message)
              ? "缺少同意，无法发起交换。请勾选同意后重试。"
              : "发起交换失败，请稍后重试。";
          notify(msg, "error");
        },
      }
    );
  });

  if (targetQuery.isLoading) {
    return <SkeletonBlock variant="card" count={2} />;
  }

  if (targetQuery.isError || !targetQuery.data) {
    return (
      <div className="rounded-card border border-danger/30 bg-danger/5 p-6 text-center text-sm text-text-muted">
        <p className="mb-3">目标模块加载失败或不存在。</p>
        <SecondaryButton iconLeft="refresh" onClick={() => targetQuery.refetch()}>
          重试
        </SecondaryButton>
      </div>
    );
  }

  const target = targetQuery.data;

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      {/* 目标模块（只读展示） */}
      <Card
        header={
          <h2 className="flex items-center gap-2 text-base font-semibold text-text">
            <Icon name="swap_horiz" size={18} aria-hidden className="text-primary" />
            交换目标模块
          </h2>
        }
      >
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-text">{target.title}</p>
          <p className="text-sm text-text-muted">{target.summary}</p>
          {target.topics.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {target.topics.map((t) => (
                <TopicChip key={t} label={t} />
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* 可选互惠模块 */}
      <Card
        header={
          <h2 className="text-base font-semibold text-text">提供我的模块（可选）</h2>
        }
      >
        <FormField
          label="互惠提供的模块"
          description="选择一份你已发布的模块作为互惠；不选则为单向请求。"
          renderControl={(p) => (
            <select
              {...p}
              {...register("offeredModuleId")}
              className="w-full rounded-control border border-border bg-surface px-3 py-2 text-sm text-text focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            >
              <option value="">不提供（单向请求）</option>
              {myModules.map((m) => (
                <option key={m.moduleId} value={m.moduleId}>
                  {m.title}
                </option>
              ))}
            </select>
          )}
        />
        {myModulesQuery.isSuccess && myModules.length === 0 && (
          <p className="mt-2 text-xs text-text-subtle">
            你还没有可提供的已发布模块，可发起单向请求。
          </p>
        )}
      </Card>

      {/* 留言 */}
      <Card header={<h2 className="text-base font-semibold text-text">留言（可选）</h2>}>
        <FormField
          label="给对方的留言"
          error={errors.message?.message}
          renderControl={(p) => (
            <Textarea
              {...p}
              {...register("message")}
              rows={4}
              placeholder="简要说明你希望交换的内容或意图…"
            />
          )}
        />
      </Card>

      {/* 同意勾选（INV-08） */}
      <div className="rounded-card border border-border bg-muted/30 p-4">
        <label className="flex items-start gap-2 text-sm text-text">
          <input
            type="checkbox"
            {...register("consent")}
            aria-invalid={!!errors.consent}
            className="mt-0.5 size-4 rounded border-border text-primary focus-visible:ring-2 focus-visible:ring-primary"
          />
          <span>
            我已阅读并同意交换规则：联系方式默认私密，仅在交换被接受后于交换详情页披露；本次交换不涉及任何金钱或报酬。
          </span>
        </label>
        {errors.consent && (
          <p className="mt-1.5 flex items-center gap-1 text-xs text-danger">
            <Icon name="error" size={12} aria-hidden />
            {errors.consent.message}
          </p>
        )}
      </div>

      <div className="flex justify-end gap-3 border-t border-border pt-4">
        <SecondaryButton onClick={() => router.back()}>取消</SecondaryButton>
        <PrimaryButton type="submit" iconLeft="swap_horiz" loading={createExchange.isPending}>
          发起交换
        </PrimaryButton>
      </div>
    </form>
  );
}
