import { IconChip } from "@/components/shared";

/*
  COMP-194 AuthNoteBlock（认证说明块）。Callout + lock 图标徽（COMP-013 IconChip）。
  以文字承接写约束：GitHub 认证 + 同意门 + 隐私门校验（细则在 FR-030/HARD-01 与阶段 15，
  本块只引用不重写）。本块不渲染任何写表单 / 提交按钮（不越 NFR-005 同意门）。
*/
export interface AuthNoteBlockProps {
  title?: string;
  points: string[];
}

export function AuthNoteBlock({
  title = "写操作要求",
  points,
}: AuthNoteBlockProps) {
  return (
    <aside
      aria-label={title}
      className="flex gap-3 rounded-control border border-info/20 bg-info/5 p-3"
    >
      <IconChip icon="lock" tone="info" size="md" />
      <div className="flex flex-col gap-1.5">
        <p className="text-sm font-semibold text-text">{title}</p>
        <ul className="flex list-disc flex-col gap-1 pl-4 text-sm text-text-muted">
          {points.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
