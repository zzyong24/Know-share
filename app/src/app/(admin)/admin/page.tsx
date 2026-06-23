import { AdminConsole } from "@/components/admin/admin-console";

/*
  PAGE-080~085 审核控制台（route /admin，仅管理员 IA-011）。
  同页分区承载：风险摘要（080）+ 队列（081）+ 详情面板（082）+ 审计日志（083）
  + 举报处置（084，队列内 source=report 行）+ 破坏性二次确认（085，对话框）。ASM-049。
  权限门在 AdminConsole 客户端落地（非管理员 403 拦截）；中间件 isAdmin 守卫由后续接入。
*/
export default function AdminPage() {
  return <AdminConsole />;
}
