import { cn } from "@/lib/utils";

/*
  COMP-041 DiscoveryHero（发现页价值主张）。PAGE-002 区域①。
  纯展示：唯一 <h1> + 可选副标题；不含主 CTA（避免同屏两个等权主 CTA，UI_RULES）。
*/
export interface DiscoveryHeroProps {
  title?: string;
  subtitle?: string;
  align?: "left" | "center";
}

const DEFAULT_TITLE = "让 Agent 帮你发现值得互换的知识库模块";
const DEFAULT_SUBTITLE =
  "浏览脱敏清单卡片，在不接触私有内容的前提下评估，再决定是否请求交换。";

export function DiscoveryHero({
  title = DEFAULT_TITLE,
  subtitle = DEFAULT_SUBTITLE,
  align = "left",
}: DiscoveryHeroProps) {
  return (
    <section className={cn("py-2", align === "center" && "text-center")}>
      <h1 className="text-2xl font-semibold text-text sm:text-3xl">{title}</h1>
      {subtitle && (
        <p className="mt-2 max-w-2xl text-sm text-text-muted sm:text-base">
          {subtitle}
        </p>
      )}
    </section>
  );
}
