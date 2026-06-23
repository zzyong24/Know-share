"use client";

import * as React from "react";
import { FaqAccordion } from "@/components/shared/faq-accordion";
import { EmptyState } from "@/components/shared/empty-state";

/*
  COMP-213 AboutFaq（PAGE-104）：帮助 / FAQ 手风琴（包装共享 COMP-028 FaqAccordion）。
  答案与产品真源一致——修正真源「E2EE / 链上」表述（NFR-001/FR-090/FLOW-003）。
  键盘可达、aria-expanded（shadcn/Radix 提供）；items 为空 → EmptyState（COMP-021）。
*/
export interface AboutFaqLink {
  label: string;
  href: string;
}

export interface AboutFaqItem {
  id: string;
  question: string;
  answer: string;
  links?: AboutFaqLink[];
}

export interface AboutFaqProps {
  items?: AboutFaqItem[];
  allowMultiple?: boolean;
}

export const DEFAULT_FAQ_ITEMS: AboutFaqItem[] = [
  {
    id: "faq-storage",
    question: "Know-share 会存储我的原始笔记吗？",
    answer:
      "不会。平台只保存脱敏后的清单元数据与公开关系，你的原始笔记和文件始终留在本地，平台不持有、不转存原始内容。",
  },
  {
    id: "faq-privacy",
    question: "交换是如何保护隐私的？",
    answer:
      "提交前经隐私门扫描（密钥、邮箱、文件路径、私有 URL、长摘录、PII），有发现需脱敏；交换前有所有者明确同意门；最终的私有交付走平台外通道（默认你的 GitHub 私有仓库），平台只记录交换关系，不传输原始内容。",
  },
  {
    id: "faq-contribute",
    question: "如何参与开源贡献？",
    answer:
      "Know-share 开源可审计，欢迎通过 GitHub 仓库提交 PR 或 Issue 参与规则、schema 与界面的改进。",
    links: [{ label: "查看仓库", href: "#hero" }],
  },
  {
    id: "faq-agent-skill",
    question: "什么是 Agent 技能模块？",
    answer:
      "Agent 技能模块是一组本地 / MCP 工具，帮助你建清单、做脱敏、校验、打包与提交反馈，让 agent 在不接触原始内容的前提下完成发现与交换流程。",
    links: [{ label: "了解 Agent 技能", href: "/skills" }],
  },
];

export function AboutFaq({
  items = DEFAULT_FAQ_ITEMS,
  allowMultiple = false,
}: AboutFaqProps) {
  return (
    <section
      id="faq"
      aria-labelledby="about-faq-title"
      className="border-t border-border py-12"
    >
      <h2 id="about-faq-title" className="text-2xl font-semibold text-text">
        帮助 / 常见问题
      </h2>
      <div className="mt-6">
        {items.length === 0 ? (
          <EmptyState
            icon="info"
            title="暂无常见问题"
            description="常见问题即将上线。"
          />
        ) : (
          <FaqAccordion
            type={allowMultiple ? "multiple" : "single"}
            items={items.map((it) => ({
              key: it.id,
              question: it.question,
              answer: (
                <div>
                  <p className="leading-relaxed">{it.answer}</p>
                  {it.links && it.links.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-4">
                      {it.links.map((lk) => (
                        <a
                          key={lk.href}
                          href={lk.href}
                          className="text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
                        >
                          {lk.label}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ),
            }))}
          />
        )}
      </div>
    </section>
  );
}
