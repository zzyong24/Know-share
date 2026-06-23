/*
  COMP-006 Footer（站点页脚）。footer role=contentinfo；外链含「（新窗口打开）」可读提示 + rel=noopener。
  无 PII（INV-09）。
*/
export interface FooterLink {
  label: string;
  href: string;
  external?: boolean;
}

export interface FooterProps {
  links?: FooterLink[];
  repoUrl?: string;
}

const DEFAULT_LINKS: FooterLink[] = [
  { label: "关于", href: "/about" },
  { label: "开发者 API", href: "/developers" },
  { label: "隐私说明", href: "/about#privacy" },
];

export function Footer({ links = DEFAULT_LINKS, repoUrl }: FooterProps) {
  const allLinks: FooterLink[] = repoUrl
    ? [...links, { label: "开源仓库", href: repoUrl, external: true }]
    : links;

  return (
    <footer
      role="contentinfo"
      className="mt-auto border-t border-border bg-surface"
    >
      <div className="mx-auto flex max-w-[1280px] flex-col items-center justify-between gap-3 px-6 py-6 text-sm text-text-muted sm:flex-row">
        <nav aria-label="页脚导航" className="flex flex-wrap gap-4">
          {allLinks.map((l) =>
            l.external ? (
              <a
                key={l.href}
                href={l.href}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary"
              >
                {l.label}
                <span className="sr-only">（新窗口打开）</span>
              </a>
            ) : (
              <a key={l.href} href={l.href} className="hover:text-primary">
                {l.label}
              </a>
            )
          )}
        </nav>
        <span className="text-text-subtle">
          © {new Date().getFullYear()} Know-share · 隐私优先的知识交换平台
        </span>
      </div>
    </footer>
  );
}
