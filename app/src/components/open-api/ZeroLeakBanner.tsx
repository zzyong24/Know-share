import type { ReactNode } from "react";
import { Icon } from "@/components/shared";

/*
  COMP-190 ZeroLeakBanner（零泄露承诺横幅）。success 浅底 + shield 图标。
  把产品级承诺可见化：公开读 API 只暴露脱敏清单与聚合统计，绝不返回原始内容或私有 URL
  （INV-01/04 / FR-110）。归一化已移除真源 HTML 的「加密网关认证」未追溯文案（归一项 1）。
*/
export interface ZeroLeakBannerProps {
  title?: string;
  description?: string;
  /** 可选插入 COMP-198 StatsTeaser，承诺旁展示真实聚合数 */
  statsSlot?: ReactNode;
}

export function ZeroLeakBanner({
  title = "零私有内容泄露",
  description = "公开 API 只暴露脱敏清单与聚合统计，绝不返回原始知识内容或私有 URL。",
  statsSlot,
}: ZeroLeakBannerProps) {
  return (
    <section
      aria-label="隐私承诺"
      className="rounded-card border border-success/20 bg-success/10 p-5"
    >
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-control bg-success/15 text-success">
          <Icon name="shield" size={22} aria-hidden />
        </span>
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-semibold text-text">{title}</h2>
          <p className="max-w-2xl text-sm text-text-muted">{description}</p>
        </div>
      </div>
      {statsSlot && <div className="mt-4">{statsSlot}</div>}
    </section>
  );
}
