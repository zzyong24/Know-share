"use client";

import { Icon } from "@/components/shared/icon";

/*
  COMP-214 AuditLinkRow（PAGE-105）：可审计规则 / 隐私模型 / 数据契约三个入口。
  兑现 NFR-004（规则 / schema / 信任解释 / 隐私边界可在仓库产物中查阅）。
  每链接图标 + 文字双载体（图标 aria-hidden，文字为唯一信息载体，NFR-007）。
  available:false → 不渲染死链，标「即将开放」（ASM-106）；外链 rel="noopener noreferrer"。
  目标须公开、可审计、不含 PII / 私有内容（INV-04）。
*/
export interface AuditLink {
  icon: string;
  label: string;
  href: string;
  available: boolean;
  /** 是否平台外链接（新窗口打开） */
  external?: boolean;
}

export interface AuditLinkRowProps {
  links?: AuditLink[];
}

// 图标使用 icon-map 已映射规范名（contract 未映射 → 用等价 description）。
export const DEFAULT_AUDIT_LINKS: AuditLink[] = [
  {
    icon: "fact_check",
    label: "可审计规则",
    href: "/docs/rules",
    available: true,
  },
  {
    icon: "shield",
    label: "隐私模型",
    href: "/docs/privacy-model",
    available: true,
  },
  {
    icon: "description",
    label: "数据契约",
    href: "/docs/data-contract",
    available: true,
  },
];

export function AuditLinkRow({ links = DEFAULT_AUDIT_LINKS }: AuditLinkRowProps) {
  return (
    <section
      id="audit-links"
      aria-labelledby="about-audit-title"
      className="border-t border-border py-12"
    >
      <h2 id="about-audit-title" className="text-2xl font-semibold text-text">
        可审计产物
      </h2>
      <p className="mt-2 text-sm text-text-muted">
        规则、schema、信任解释与隐私边界均可在公开仓库产物中查阅。
      </p>
      <div className="mt-6 flex flex-wrap justify-start gap-4">
        {links.map((link) => {
          if (!link.available) {
            return (
              <span
                key={link.label}
                className="inline-flex items-center gap-2 rounded-control border border-border bg-muted/40 px-4 py-2 text-sm text-text-subtle"
              >
                <Icon name={link.icon} size={18} aria-hidden />
                {link.label}
                <span className="text-xs">（即将开放）</span>
              </span>
            );
          }
          return (
            <a
              key={link.label}
              href={link.href}
              {...(link.external
                ? {
                    target: "_blank",
                    rel: "noopener noreferrer",
                    "aria-label": `${link.label}，在新窗口打开`,
                  }
                : {})}
              className="inline-flex items-center gap-2 rounded-control border border-border bg-surface px-4 py-2 text-sm font-medium text-text transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <Icon name={link.icon} size={18} aria-hidden />
              {link.label}
              {link.external && (
                <Icon name="open_in_new" size={14} aria-hidden />
              )}
            </a>
          );
        })}
      </div>
    </section>
  );
}
