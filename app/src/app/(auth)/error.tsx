"use client";

import { EmptyState } from "@/components/shared/empty-state";

export default function AuthError({ reset }: { error: Error; reset: () => void }) {
  return (
    <EmptyState
      icon="error"
      tone="danger"
      title="页面加载出错"
      description="请稍后重试，或返回发现页。"
      action={{ label: "重试", onClick: reset }}
      secondaryAction={{ label: "返回发现页", href: "/" }}
    />
  );
}
