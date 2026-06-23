import { Icon } from "@/components/shared";

/*
  COMP-197 RateLimitNote（速率限制说明）。行内中性文字标注。
  以文字说明公开读端点受速率限制（FR-110 / NFR-006）；具体阈值延后到阶段 15 服务契约，
  本组件默认不写死数值（ASM-057）。
*/
export interface RateLimitNoteProps {
  text?: string;
}

export function RateLimitNote({
  text = "公开读端点受速率限制（具体配额见服务契约）",
}: RateLimitNoteProps) {
  return (
    <p className="inline-flex items-center gap-1 text-xs text-text-muted">
      <Icon name="schedule" size={13} aria-hidden />
      {text}
    </p>
  );
}
