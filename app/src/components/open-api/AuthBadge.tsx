import { StatusPill } from "@/components/shared";

/*
  COMP-193 AuthBadge（认证徽）。共享 COMP-011 StatusPill 的语义特化。
  GET=「公开读」、POST=「需 GitHub 认证 + 同意门」（PAGE-090 验收 3 / NFR-005/006 / DEC-006）。
  类型层限定 public-read / auth-write，杜绝「公开写」组合。
  语义由文字承载（非仅颜色，NFR-007）。
*/
export interface AuthBadgeProps {
  kind: "public-read" | "auth-write";
  size?: "sm" | "md";
}

export function AuthBadge({ kind, size = "md" }: AuthBadgeProps) {
  if (kind === "public-read") {
    return <StatusPill tone="primary" label="公开读" size={size} />;
  }
  return (
    <StatusPill
      tone="info"
      label="需 GitHub 认证 + 同意门"
      icon="lock"
      size={size}
    />
  );
}
