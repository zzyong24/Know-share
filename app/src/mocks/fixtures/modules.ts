/*
  MOCK 种子：modules（ENT-003 公开投影）+ manifests（ENT-004 脱敏）+ topics（ENT-020）。
  脱敏摘要、来源统计、主题、信任级别；**不含 contact / 原始内容**（INV-01/03/04）。
*/
import type { KnowledgeModule, Manifest, Topic } from "@/lib/types";

export const topics: Topic[] = [
  { id: "t-agent", label: "Agent", moduleCount: 4 },
  { id: "t-rag", label: "RAG", moduleCount: 3 },
  { id: "t-growth", label: "增长", moduleCount: 2 },
  { id: "t-privacy", label: "隐私", moduleCount: 2 },
  { id: "t-km", label: "知识管理", moduleCount: 3 },
  { id: "t-devops", label: "DevOps", moduleCount: 1 },
];

export const modules: KnowledgeModule[] = [
  {
    id: "m-agent-memory",
    title: "Agent 记忆系统设计模式",
    summary: "总结长期 / 短期记忆分层、摘要压缩与检索召回的工程模式（脱敏摘要）。",
    topics: ["Agent", "知识管理"],
    sourceStats: { notes: 23, links: 12, files: 8, words: 18700 },
    trustLevel: "high",
    status: "Published",
    exchangeCount: 42,
    favoriteCount: 156,
    freshness: "3 天前更新",
    ownerLogin: "zyongzhu24",
  },
  {
    id: "m-multimodal-rag",
    title: "多模态 RAG 检索流水线",
    summary: "图文混合切块、向量化与重排序的端到端流水线设计（脱敏摘要）。",
    topics: ["RAG", "Agent"],
    sourceStats: { notes: 18, links: 20, files: 5, words: 14200 },
    trustLevel: "high",
    status: "Published",
    exchangeCount: 31,
    favoriteCount: 98,
    freshness: "1 周前更新",
    ownerLogin: "rag-builder",
  },
  {
    id: "m-growth-lib",
    title: "AI 产品增长实验库",
    summary: "AI 产品冷启动与留存的可复用增长实验清单（脱敏摘要）。",
    topics: ["增长"],
    sourceStats: { notes: 31, links: 8, files: 3, words: 9800 },
    trustLevel: "medium",
    status: "Published",
    exchangeCount: 17,
    favoriteCount: 64,
    freshness: "2 周前更新",
    ownerLogin: "growth-lab",
  },
  {
    id: "m-private-deploy",
    title: "私有部署脚本集",
    summary: "用于审核 block 场景的样本模块（含疑似私有路径，前端须脱敏）。",
    topics: ["DevOps", "隐私"],
    sourceStats: { notes: 9, links: 4, files: 12, words: 5400 },
    trustLevel: "low",
    status: "Draft",
    exchangeCount: 0,
    favoriteCount: 2,
    freshness: "刚刚创建",
    ownerLogin: "ops-bot",
  },
  {
    id: "m-km-system",
    title: "个人知识库治理方法论",
    summary: "笔记原子化、双链与定期回顾的治理方法论（脱敏摘要）。",
    topics: ["知识管理"],
    sourceStats: { notes: 52, links: 30, files: 6, words: 22100 },
    trustLevel: "high",
    status: "Published",
    exchangeCount: 28,
    favoriteCount: 121,
    freshness: "5 天前更新",
    ownerLogin: "knowledge-trader",
  },
  {
    id: "m-privacy-redact",
    title: "知识脱敏与隐私边界实践",
    summary: "提交前的隐私扫描、泛化建议与边界声明实践（脱敏摘要）。",
    topics: ["隐私", "Agent"],
    sourceStats: { notes: 16, links: 11, files: 4, words: 11300 },
    trustLevel: "high",
    status: "Published",
    exchangeCount: 22,
    favoriteCount: 87,
    freshness: "4 天前更新",
    ownerLogin: "sec-researcher",
  },
];

export const manifests: Manifest[] = modules.map((m) => ({
  moduleId: m.id,
  summary: m.summary,
  topics: m.topics,
  freshness: m.freshness,
  sourceStats: m.sourceStats,
  contentCommitment:
    m.id === "m-agent-memory" ? "承诺保持清单与实际内容一致" : undefined,
  privacyBoundary: "已通过隐私扫描；不含原始内容与联系方式（INV-01/03）。",
  version: "v1.2.0",
}));
