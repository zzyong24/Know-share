"use client";

import { EmptyState } from "@/components/shared/empty-state";

/* 公开段错误边界（FRONTEND_SPEC §3）。不暴露后端细节，提供重试。 */
export default function PublicError({ reset }: { error: Error; reset: () => void }) {
  return (
    <EmptyState
      icon="error"
      tone="danger"
      title="页面加载出错"
      description="请稍后重试，或返回发现页继续浏览。"
      action={{ label: "重试", onClick: reset }}
      secondaryAction={{ label: "返回发现页", href: "/" }}
    />
  );
}
