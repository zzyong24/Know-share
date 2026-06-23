import { EmptyState } from "@/components/shared/empty-state";

/* 公开段 404（FRONTEND_SPEC §3）。 */
export default function PublicNotFound() {
  return (
    <EmptyState
      icon="search_off"
      title="页面不存在"
      description="你访问的页面可能已被移动或删除。"
      action={{ label: "返回发现页", href: "/" }}
    />
  );
}
