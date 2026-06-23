import type { Tone } from "@/lib/types";

/*
  语义色调 → Tailwind 令牌类（UI-001）。不硬编码十六进制。
  注意：tint/前景对比满足 ≥4.5:1（subtle 底浅色 + 深色文字）。
*/
export const SUBTLE_TONE: Record<Tone, string> = {
  primary: "bg-primary-subtle text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  danger: "bg-danger/10 text-danger",
  info: "bg-info/10 text-info",
  accent: "bg-accent/10 text-accent",
  neutral: "bg-muted text-text-muted",
};

export const SOLID_TONE: Record<Tone, string> = {
  primary: "bg-primary text-white",
  success: "bg-success text-white",
  warning: "bg-warning text-white",
  danger: "bg-danger text-white",
  info: "bg-info text-white",
  accent: "bg-accent text-white",
  neutral: "bg-text-muted text-white",
};
