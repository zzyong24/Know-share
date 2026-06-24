/*
  邮件发送封装（Resend；FR-120 邮件旁路，站内通知优先 ASM-048）。
  - 降级安全：未配 RESEND_API_KEY → 不发（返回 false），站内通知仍落库，不报错。
  - 可注入：测试用 setEmailSender 注入假发送器断言调用；resetEmailSender 还原。
  - 懒加载 resend SDK（仅运行期 import；缺包/缺 key 都降级，不阻断主流程）。
*/
export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
}

export type EmailSender = (msg: EmailMessage) => Promise<void>;

let senderOverride: EmailSender | null | undefined; // undefined=未注入；null=显式禁用

/** 测试：注入假发送器（断言收件/主题/正文）；传 null 显式禁用发送。 */
export function setEmailSender(sender: EmailSender | null): void {
  senderOverride = sender;
}

/** 测试：清除注入，恢复真实 Resend 路径。 */
export function resetEmailSender(): void {
  senderOverride = undefined;
}

/**
  发送一封纯文本邮件。返回是否实际发出（降级/未配 → false）。
  调用方应把它当 best-effort：失败绝不冒泡打断站内通知/主流程。
*/
export async function sendEmail(msg: EmailMessage): Promise<boolean> {
  if (senderOverride !== undefined) {
    if (!senderOverride) return false;
    await senderOverride(msg);
    return true;
  }
  const key = process.env.RESEND_API_KEY;
  if (!key) return false; // 未配置 → 仅站内通知
  try {
    const { Resend } = await import("resend");
    const resend = new Resend(key);
    await resend.emails.send({
      from: process.env.RESEND_FROM ?? "Know-share <noreply@know-share.dev>",
      to: msg.to,
      subject: msg.subject,
      text: msg.text,
    });
    return true;
  } catch {
    return false; // 发送失败不影响站内通知
  }
}
