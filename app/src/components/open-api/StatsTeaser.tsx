import { StatBlock, SkeletonBlock } from "@/components/shared";

/*
  COMP-198 StatsTeaser（可选真实聚合统计内联）。承诺横幅旁 / #stats 区展示
  /api/stats 聚合数（与 IA-013 同源）。纯聚合、零 PII（ENT-019 / INV-09）。
  失败回退中性占位，不阻断文档阅读（PAGE-090 States「统计加载」）。
  数字有文字标签（经 COMP-014 StatBlock，NFR-007）。
*/
export interface StatsTeaserMetrics {
  usersCount: number;
  modulesCount: number;
  exchangesCount: number;
  privacyGatePassRate: number;
  window: string;
  asOf: string;
}

export interface StatsTeaserProps {
  metrics?: StatsTeaserMetrics;
  loading?: boolean;
  fallbackText?: string;
}

export function StatsTeaser({
  metrics,
  loading = false,
  fallbackText = "统计暂不可用",
}: StatsTeaserProps) {
  if (loading) {
    return (
      <div aria-busy="true" className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <SkeletonBlock variant="stat" count={4} />
      </div>
    );
  }

  if (!metrics) {
    return <p className="text-sm text-text-muted">{fallbackText}</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      <StatBlock value={metrics.usersCount.toLocaleString()} label="用户总数" icon="group" />
      <StatBlock value={metrics.modulesCount.toLocaleString()} label="模块总数" icon="inventory_2" />
      <StatBlock value={metrics.exchangesCount.toLocaleString()} label="交换总数" icon="swap_horiz" />
      <StatBlock
        value={`${Math.round(metrics.privacyGatePassRate * 100)}%`}
        label="隐私门通过率"
        icon="shield"
        tone="success"
      />
    </div>
  );
}
