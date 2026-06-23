"use client";

import { Card, Icon } from "@/components/shared";

/*
  COMP-195 DeveloperResourceCard（开发者资源卡）。基于共享 COMP-009 Card。
  指向仓库/帮助（IA-013）的中性集成支持入口。归一化已移除真源 HTML 的
  「申请企业级访问」付费/企业 CTA 与商业措辞（DEC-007 / 归一项 3）。
  本卡不含任何付费 / 计费 / 企业级链接或措辞（DEC-007 硬约束）。
*/
export interface DeveloperResourceLink {
  label: string;
  href: string;
  external?: boolean;
}

export interface DeveloperResourceCardProps {
  title?: string;
  links: DeveloperResourceLink[];
  onResourceClick?: (href: string) => void;
}

export function DeveloperResourceCard({
  title = "开发者资源",
  links,
  onResourceClick,
}: DeveloperResourceCardProps) {
  return (
    <Card padding="sm">
      <p className="mb-2 text-sm font-semibold text-text">{title}</p>
      <ul className="flex flex-col gap-1.5">
        {links.map((link) => (
          <li key={link.href}>
            <a
              href={link.href}
              {...(link.external
                ? {
                    target: "_blank",
                    rel: "noopener noreferrer",
                    "aria-label": `${link.label}（新标签页打开）`,
                  }
                : {})}
              onClick={() => onResourceClick?.(link.href)}
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            >
              {link.label}
              {link.external && (
                <Icon name="open_in_new" size={13} aria-hidden />
              )}
            </a>
          </li>
        ))}
      </ul>
    </Card>
  );
}
