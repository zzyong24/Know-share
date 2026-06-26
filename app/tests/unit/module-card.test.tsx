import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ModuleCard } from "@/components/shared/module-card";
import type { KnowledgeModule } from "@/lib/types";

const baseModule: KnowledgeModule = {
  id: "m-1",
  title: "Agent 记忆系统",
  summary: "脱敏摘要",
  topics: ["Agent", "RAG"],
  sourceStats: { notes: 23, links: 12, files: 8, words: 18700 },
  trustLevel: "high",
  status: "Published",
  exchangeCount: 42,
  favoriteCount: 156,
  freshness: "3 天前更新",
  ownerLogin: "zyongzhu24",
};

/*
  COMP-010 ModuleCard 测试：仅渲染公开字段（注入私有字段被白名单丢弃 INV-04）；
  匿名请求交换引导登录；收藏 aria-pressed 切换；status 映射；loading Skeleton。
*/
describe("ModuleCard（COMP-010）", () => {
  it("渲染公开脱敏字段", () => {
    render(<ModuleCard module={baseModule} href="/modules/m-1" />);
    expect(screen.getByText("Agent 记忆系统")).toBeInTheDocument();
    expect(screen.getByText("脱敏摘要")).toBeInTheDocument();
    expect(screen.getByText("已发布")).toBeInTheDocument();
  });

  it("注入异常私有字段时被白名单丢弃（INV-04）", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const dirty = { ...baseModule, contact: "z@example.com", rawContent: "secret" };
    render(<ModuleCard module={dirty as KnowledgeModule} href="/modules/m-1" />);
    // 私有内容不渲染
    expect(screen.queryByText("z@example.com")).not.toBeInTheDocument();
    expect(screen.queryByText("secret")).not.toBeInTheDocument();
    // 守卫告警触发
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it("匿名点击请求交换引导登录而非直接请求", async () => {
    const onRequest = vi.fn();
    const onRequireAuth = vi.fn();
    render(
      <ModuleCard
        module={baseModule}
        href="/modules/m-1"
        isAuthenticated={false}
        onRequestExchange={onRequest}
        onRequireAuth={onRequireAuth}
      />
    );
    await userEvent.click(
      screen.getByRole("button", { name: /请求交换 Agent 记忆系统/ })
    );
    expect(onRequireAuth).toHaveBeenCalled();
    expect(onRequest).not.toHaveBeenCalled();
  });

  it("登录态点击请求交换触发 onRequestExchange", async () => {
    const onRequest = vi.fn();
    render(
      <ModuleCard
        module={baseModule}
        href="/modules/m-1"
        isAuthenticated
        onRequestExchange={onRequest}
      />
    );
    await userEvent.click(
      screen.getByRole("button", { name: /请求交换/ })
    );
    expect(onRequest).toHaveBeenCalledWith("m-1");
  });

  it("收藏按钮 aria-pressed 反映状态", () => {
    render(<ModuleCard module={baseModule} href="/modules/m-1" favorited />);
    expect(
      screen.getByRole("button", { name: /取消收藏/ })
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("loading 渲染骨架而非内容", () => {
    render(<ModuleCard module={baseModule} href="/modules/m-1" loading />);
    expect(screen.queryByText("Agent 记忆系统")).not.toBeInTheDocument();
  });
});

describe("ModuleCard 本人自看（isOwner，个人中心「我的模块」）", () => {
  it("owner + 草稿 → 显示「去提交发布」，不显示「请求交换」", () => {
    render(
      <ModuleCard
        module={{ ...baseModule, status: "Draft" }}
        href="/modules/m-1"
        isOwner
        onOwnerPublish={() => {}}
      />
    );
    expect(screen.getByRole("button", { name: /提交发布/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /请求交换/ })).not.toBeInTheDocument();
  });
  it("owner + 已发布 → 不显示「请求交换」", () => {
    render(<ModuleCard module={{ ...baseModule, status: "Published" }} href="/modules/m-1" isOwner />);
    expect(screen.queryByRole("button", { name: /请求交换/ })).not.toBeInTheDocument();
  });
});
