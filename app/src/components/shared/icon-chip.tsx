import { Icon } from "./icon";
import { SUBTLE_TONE } from "./tone";
import { cn } from "@/lib/utils";
import type { Tone } from "@/lib/types";

/*
  COMP-013 IconChip（着色图标方块）。浅底圆角方块 + 单一族字形。
  默认装饰性（aria-hidden）；若为唯一语义载体须传 label（NFR-007）。
*/
export interface IconChipProps {
  icon: string;
  tone?: Tone;
  size?: "sm" | "md" | "lg";
  shape?: "rounded" | "circle";
  /** 唯一语义载体时提供，注入 visually-hidden 文本并去装饰态 */
  label?: string;
  className?: string;
}

const BOX = { sm: "size-6", md: "size-8", lg: "size-10" } as const;
const ICON_SIZE = { sm: 14, md: 18, lg: 22 } as const;

export function IconChip({
  icon,
  tone = "primary",
  size = "md",
  shape = "rounded",
  label,
  className,
}: IconChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center",
        BOX[size],
        shape === "circle" ? "rounded-full" : "rounded-control",
        SUBTLE_TONE[tone],
        className
      )}
    >
      <Icon name={icon} size={ICON_SIZE[size]} aria-hidden />
      {label && <span className="sr-only">{label}</span>}
    </span>
  );
}
