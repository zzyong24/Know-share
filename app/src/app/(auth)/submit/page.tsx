import { redirect } from "next/navigation";

/*
  向导根 /submit：规范化重定向到第 1 步 /submit/source（PAGE-020 / ASM-027）。
  深链恢复（/submit/{submissionId}/...）由子路由承载，后续接入草稿恢复时补 [submissionId] 段。
*/
export default function SubmitRootPage() {
  redirect("/submit/source");
}
