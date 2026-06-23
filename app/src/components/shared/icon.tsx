import { createElement } from "react";
import { resolveIcon } from "@/lib/icon-map";
import { cn } from "@/lib/utils";

/*
  统一图标渲染入口（DEC-012 单一图标族）。
  props 传规范名（Material 名）→ icon-map → lucide 组件。
  默认装饰性 aria-hidden；若为唯一语义载体，调用方须传 aria-label（同时去掉 aria-hidden）。
  用 createElement 渲染解析出的稳定组件引用（来自 ICON_MAP，非每次渲染新建）。
*/
export interface IconProps {
  name: string;
  className?: string;
  size?: number;
  "aria-label"?: string;
  "aria-hidden"?: boolean;
}

export function Icon({
  name,
  className,
  size = 16,
  "aria-label": ariaLabel,
  "aria-hidden": ariaHidden,
}: IconProps) {
  const component = resolveIcon(name);
  const decorative = ariaHidden ?? !ariaLabel;
  return createElement(component, {
    width: size,
    height: size,
    className: cn("shrink-0", className),
    "aria-label": ariaLabel,
    "aria-hidden": decorative || undefined,
    role: ariaLabel ? "img" : undefined,
  });
}
