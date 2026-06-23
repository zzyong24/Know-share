"use client";

import * as React from "react";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

/*
  COMP-028 Accordion（FAQ）。基于 shadcn Accordion：触发器 aria-expanded + aria-controls；
  面板 region/aria-labelledby；Enter/Space 切换（Radix 提供）。
*/
export interface FaqItem {
  key: string;
  question: string;
  answer: React.ReactNode;
}

export interface FaqAccordionProps {
  items: FaqItem[];
  type?: "single" | "multiple";
  defaultOpen?: string;
}

export function FaqAccordion({
  items,
  type = "single",
  defaultOpen,
}: FaqAccordionProps) {
  // shadcn Accordion 的 type/defaultValue 受 union 类型约束，分支处理。
  if (type === "multiple") {
    return (
      <Accordion type="multiple">
        {items.map((it) => (
          <AccordionItem key={it.key} value={it.key}>
            <AccordionTrigger>{it.question}</AccordionTrigger>
            <AccordionContent>{it.answer}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    );
  }
  return (
    <Accordion type="single" collapsible defaultValue={defaultOpen}>
      {items.map((it) => (
        <AccordionItem key={it.key} value={it.key}>
          <AccordionTrigger>{it.question}</AccordionTrigger>
          <AccordionContent>{it.answer}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
