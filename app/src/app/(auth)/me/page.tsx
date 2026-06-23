import { redirect } from "next/navigation";

/*
  PAGE-060 个人中心入口（/me）。默认重定向到 /me/modules（PAGE-061 modules 分区）。
*/
export default function MeIndexPage() {
  redirect("/me/modules");
}
