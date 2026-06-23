/*
  MOCK 种子：当前会话（ENT-001 公开身份投影）。
  默认匿名（null）：公开发现面零私有内容（INV-04）、PAGE-001 默认匿名态。
  各模块批次 2 若需登录态场景，可改为返回下方 demoSession（仅含 GitHub 公开身份，无 PII/联系方式 DEC-010）。
*/
import type { Session } from "@/lib/types";

/** 登录态演示会话（按需启用）；仅 GitHub 公开身份，无联系方式（DEC-010/INV-04）。 */
export const demoSession: Session = {
  login: "zyongzhu24",
  avatarUrl: "https://avatars.example.com/zyongzhu24.png",
  isAdmin: true,
  verified: true,
};

/** 当前会话：默认匿名（null）。 */
export const session: Session | null = null;
