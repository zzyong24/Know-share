import { redirect } from "next/navigation";

/*
  PAGE-063 设置入口（/settings）。默认重定向到 /settings/contact（核心隐私面）。
*/
export default function SettingsIndexPage() {
  redirect("/settings/contact");
}
