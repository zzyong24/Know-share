import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/*
  COMP-033 Skeleton（加载占位）。装饰性 aria-hidden；父区域提供 aria-live/loading 文本。
*/
export interface SkeletonBlockProps {
  variant?: "text" | "card" | "row" | "avatar" | "stat" | "chart";
  count?: number;
  width?: string;
  height?: string;
  className?: string;
}

const VARIANT_CLASS: Record<NonNullable<SkeletonBlockProps["variant"]>, string> = {
  text: "h-4 w-full rounded",
  card: "h-40 w-full rounded-card",
  row: "h-12 w-full rounded-control",
  avatar: "size-9 rounded-full",
  stat: "h-16 w-32 rounded-control",
  chart: "h-48 w-full rounded-card",
};

export function SkeletonBlock({
  variant = "text",
  count = 1,
  width,
  height,
  className,
}: SkeletonBlockProps) {
  return (
    <div aria-hidden="true" className="flex flex-col gap-2">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton
          key={i}
          style={{ width, height }}
          className={cn(VARIANT_CLASS[variant], className)}
        />
      ))}
    </div>
  );
}
