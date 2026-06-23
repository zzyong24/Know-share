import { NotificationsView } from "@/components/account";
import type { NotificationFilter } from "@/lib/queries/account";

/*
  PAGE-062 通知中心（/notifications，可带 ?type=）。
*/
const VALID: NotificationFilter[] = [
  "all",
  "exchange",
  "review",
  "feedback",
  "community",
];

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await searchParams;
  const initial = VALID.includes(type as NotificationFilter)
    ? (type as NotificationFilter)
    : "all";
  return <NotificationsView initialFilter={initial} />;
}
