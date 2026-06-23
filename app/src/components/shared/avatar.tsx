"use client";

import {
  Avatar as UIAvatar,
  AvatarImage,
  AvatarFallback,
} from "@/components/ui/avatar";
import { Icon } from "./icon";
import { cn } from "@/lib/utils";

/*
  COMP-034 Avatar（GitHub 头像）。alt 含用户标识；fallback 首字母；verified 角标含可读文本（非仅颜色）。
*/
export interface AvatarProps {
  src?: string;
  login: string;
  size?: "xs" | "sm" | "md" | "lg";
  verified?: boolean;
  alt?: string;
  onClick?: () => void;
}

const SIZE = { xs: "size-6", sm: "size-8", md: "size-9", lg: "size-12" } as const;

export function Avatar({
  src,
  login,
  size = "md",
  verified = false,
  alt,
  onClick,
}: AvatarProps) {
  const altText = alt ?? `@${login} 的头像`;
  const initial = login.charAt(0).toUpperCase();

  const node = (
    <span className="relative inline-flex">
      <UIAvatar className={SIZE[size]}>
        <AvatarImage src={src} alt={altText} />
        <AvatarFallback aria-label={altText} className="bg-primary-subtle text-primary">
          {initial}
        </AvatarFallback>
      </UIAvatar>
      {verified && (
        <span className="absolute -right-0.5 -bottom-0.5 inline-flex items-center justify-center rounded-full bg-surface">
          <Icon name="verified" size={14} className="text-success" aria-hidden />
          <span className="sr-only">已验证</span>
        </span>
      )}
    </span>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={`查看 @${login} 的档案`}
        className={cn("rounded-full focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none")}
      >
        {node}
      </button>
    );
  }
  return node;
}
