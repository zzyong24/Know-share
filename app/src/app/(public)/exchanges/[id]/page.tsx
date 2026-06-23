import { ExchangeDetailView } from "@/components/exchange";

/*
  PAGE-031 交换详情（route /exchanges/:id）。
  公开脱敏面任何访客可看；私域动作（披露/撤回/标记交付）仅登录的该次参与方可用（INV-03）。
  exchangeId 为脱敏展示号（如 EX-2024-8842，ASM-031）。
*/
export default async function ExchangeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ExchangeDetailView exchangeId={id} />;
}
