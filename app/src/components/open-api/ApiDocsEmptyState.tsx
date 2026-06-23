import { EmptyState } from "@/components/shared";

/*
  COMP-199 ApiDocsEmptyState（文档加载失败空态）。COMP-021 EmptyState 特化。
  文档配置缺失（异常）时居中空态 + 指向 IA-013 仓库/帮助的 CTA（PAGE-090 States「空状态」）。
*/
export interface ApiDocsEmptyStateProps {
  icon?: string;
  message?: string;
  cta?: { label: string; href: string };
}

export function ApiDocsEmptyState({
  icon = "description",
  message = "文档加载失败，请稍后重试或访问仓库",
  cta = { label: "访问仓库", href: "/about" },
}: ApiDocsEmptyStateProps) {
  return (
    <EmptyState
      icon={icon}
      title="文档暂不可用"
      description={message}
      action={{ label: cta.label, href: cta.href }}
    />
  );
}
