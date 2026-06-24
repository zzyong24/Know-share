/*
  统一通知出口（FR-120 / CAP-013）。把领域事件落成：
  1) 站内通知（notifications 表，必达）；
  2) 邮件旁路（Resend，best-effort；发给本人账户邮箱，非第三方披露 → 不违 INV-03）。
  邮件失败/未配置绝不影响站内通知与主流程（ASM-048 站内优先）。
  无任何原始知识内容 / 第三方联系方式（INV-01/04）：title/body 仅事件级文案。
*/
import { and, eq } from "drizzle-orm";
import { getDb } from "@/server/db/client";
import * as schema from "@/server/db/schema";
import { sendEmail } from "@/server/email";
import type { Notification } from "@/lib/types";

export interface NotifyInput {
  userId: string;
  type: Notification["type"]; // exchange|review|feedback|community
  title: string;
  body: string;
  href?: string;
}

/** 给某用户发一条通知（站内必达 + 邮件 best-effort 到其本人邮箱）。 */
export async function notifyUser(input: NotifyInput): Promise<void> {
  const db = await getDb();
  await db.insert(schema.notifications).values({
    userId: input.userId,
    type: input.type,
    title: input.title,
    body: input.body,
    href: input.href ?? null,
  });

  // 邮件旁路：发给本人账户邮箱（自我提醒，非披露给对方）。
  try {
    const [email] = await db
      .select({ value: schema.contactInfo.value })
      .from(schema.contactInfo)
      .where(
        and(
          eq(schema.contactInfo.userId, input.userId),
          eq(schema.contactInfo.type, "email")
        )
      )
      .limit(1);
    if (email?.value) {
      await sendEmail({
        to: email.value,
        subject: input.title,
        text: input.href ? `${input.body}\n\n${input.href}` : input.body,
      });
    }
  } catch {
    // 邮件任何失败都不影响站内通知（已落库）。
  }
}
