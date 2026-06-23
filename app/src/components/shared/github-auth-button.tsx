"use client";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Octocat } from "./octocat";
import { Avatar } from "./avatar";
import { Icon } from "./icon";
import type { Session } from "@/lib/types";

/*
  COMP-004 GitHubAuthButton。匿名→「用 GitHub 登录」（Octocat 唯一品牌例外）；
  登录→头像 + 用户菜单。Verified 含文字（非仅图标色）。菜单 aria-haspopup/expanded（Radix 提供）。
*/
export interface GitHubAuthButtonProps {
  session?: Session | null;
  loading?: boolean;
  onSignIn?: () => void;
  onSignOut?: () => void;
  onMenuSelect?: (key: string) => void;
}

export function GitHubAuthButton({
  session,
  loading = false,
  onSignIn,
  onSignOut,
  onMenuSelect,
}: GitHubAuthButtonProps) {
  if (loading) {
    return (
      <Button variant="outline" size="sm" disabled aria-busy>
        <span className="size-4 animate-spin rounded-full border-2 border-current/30 border-t-current" aria-hidden />
        登录中
      </Button>
    );
  }

  if (!session) {
    return (
      <Button
        variant="outline"
        size="sm"
        aria-label="使用 GitHub 登录"
        onClick={onSignIn}
        className="gap-2 focus-visible:ring-primary"
      >
        <Octocat className="size-4" />
        用 GitHub 登录
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`@${session.login} 的用户菜单`}
          className="inline-flex items-center gap-1.5 rounded-pill focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
        >
          <Avatar
            src={session.avatarUrl}
            login={session.login}
            verified={session.verified}
            size="sm"
          />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {session.verified && (
          <DropdownMenuItem disabled className="gap-2 text-success">
            <Icon name="verified" size={14} aria-hidden /> 已验证
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={() => onMenuSelect?.("me")}>
          <Icon name="person" size={14} aria-hidden /> 个人中心
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onMenuSelect?.("settings")}>
          <Icon name="settings" size={14} aria-hidden /> 设置
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onSignOut}>
          <Icon name="logout" size={14} aria-hidden /> 退出
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
