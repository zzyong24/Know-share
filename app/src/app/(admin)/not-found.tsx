import { EmptyState } from "@/components/shared/empty-state";

export default function AdminNotFound() {
  return (
    <EmptyState
      icon="search_off"
      title="页面不存在"
      description="你访问的页面可能已被移动或删除。"
      action={{ label: "返回发现页", href: "/" }}
    />
  );
}
