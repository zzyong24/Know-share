"use client";

import { useSearchParams } from "next/navigation";
import { ExchangeCreateForm } from "@/components/exchange";
import { EmptyState } from "@/components/shared";

/*
  /exchanges/new 客户端壳：从 ?module=<id> 取目标模块 id。
  缺 module 参数 → 引导回公开台账（无法发起无目标的交换）。
*/
export function ExchangeNewClient() {
  const searchParams = useSearchParams();
  const moduleId = searchParams.get("module") ?? "";

  if (!moduleId) {
    return (
      <EmptyState
        icon="swap_horiz"
        title="未指定交换目标模块"
        description="请从某个模块详情页点击「请求交换」进入本页面。"
        action={{ label: "查看公开交换记录", href: "/exchanges" }}
      />
    );
  }

  return <ExchangeCreateForm targetModuleId={moduleId} />;
}
