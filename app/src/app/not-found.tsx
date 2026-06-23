import { SiteShell } from "@/components/layout/SiteShell";
import { EmptyState } from "@/components/shared/empty-state";

/*
  全局 404（root not-found，覆盖未匹配路由）。包外壳以保持导航一致。
*/
export default function NotFound() {
  return (
    <SiteShell>
      <EmptyState
        icon="search_off"
        title="页面不存在"
        description="你访问的页面可能已被移动或删除。"
        action={{ label: "返回发现页", href: "/" }}
      />
    </SiteShell>
  );
}
