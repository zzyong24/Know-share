import { redirect } from "next/navigation";
import { SettingsSectionView } from "@/components/account";
import type { SettingsSection } from "@/components/account/SettingsSectionView";

/*
  PAGE-064 设置·隐私与同意 / 账户 / 通知偏好（/settings/:section）。
  contact 由静态路由 /settings/contact 处理；此处仅 privacy|account|notifications，
  非法值回退到 /settings/contact。
*/
const VALID: SettingsSection[] = ["privacy", "account", "notifications"];

export default async function SettingsSectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  if (!VALID.includes(section as SettingsSection)) redirect("/settings/contact");
  return <SettingsSectionView section={section as SettingsSection} />;
}
