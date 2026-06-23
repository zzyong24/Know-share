/*
  MOCK 种子：exchanges（ENT-007 脱敏台账）。覆盖状态机全谱（MOCK-005/006/007）。
  脱敏交换号 EX-2024-####；不含私有内容（INV-01/04）；offeredModule 可空（互惠可选 DEC-009/INV-05）。
*/
import type { Exchange } from "@/lib/types";

export const exchanges: Exchange[] = [
  {
    id: "EX-2024-8842",
    targetModuleId: "m-agent-memory",
    targetModuleTitle: "Agent 记忆系统设计模式",
    offeredModuleId: "m-multimodal-rag",
    requesterLogin: "rag-builder",
    providerLogin: "zyongzhu24",
    status: "Accepted",
    createdAt: "2026-06-18",
    updatedAt: "2026-06-21",
  },
  {
    id: "EX-2024-8843",
    targetModuleId: "m-multimodal-rag",
    targetModuleTitle: "多模态 RAG 检索流水线",
    requesterLogin: "bot-dev",
    providerLogin: "rag-builder",
    status: "Requested",
    createdAt: "2026-06-22",
    updatedAt: "2026-06-22",
  },
  {
    id: "EX-2024-8844",
    targetModuleId: "m-km-system",
    targetModuleTitle: "个人知识库治理方法论",
    offeredModuleId: "m-growth-lib",
    requesterLogin: "growth-lab",
    providerLogin: "knowledge-trader",
    status: "Completed",
    createdAt: "2026-05-30",
    updatedAt: "2026-06-10",
  },
  {
    id: "EX-2024-8845",
    targetModuleId: "m-privacy-redact",
    targetModuleTitle: "知识脱敏与隐私边界实践",
    requesterLogin: "newcomer",
    providerLogin: "sec-researcher",
    status: "Rejected",
    createdAt: "2026-06-15",
    updatedAt: "2026-06-16",
  },
  {
    id: "EX-2024-8846",
    targetModuleId: "m-agent-memory",
    targetModuleTitle: "Agent 记忆系统设计模式",
    requesterLogin: "knowledge-trader",
    providerLogin: "zyongzhu24",
    status: "InReview",
    createdAt: "2026-06-20",
    updatedAt: "2026-06-22",
  },
  {
    id: "EX-2024-8847",
    targetModuleId: "m-growth-lib",
    targetModuleTitle: "AI 产品增长实验库",
    requesterLogin: "bot-dev",
    providerLogin: "growth-lab",
    status: "Expired",
    createdAt: "2026-05-01",
    updatedAt: "2026-05-15",
  },
];
