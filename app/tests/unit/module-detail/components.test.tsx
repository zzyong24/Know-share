import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  ModuleSummaryHeader,
  SourceStatsPanel,
  PrivacyBoundaryCard,
  ManifestPreview,
  TrustSignalAside,
  RequestExchangeCTA,
  ModuleDetailLayout,
} from "@/components/module-detail";

/*
  module-detail 组件单测（COMP-050~056）。
  覆盖核心不变量：脱敏（INV-01）、Manifest 屏蔽 contact（INV-03/ASM-024）、
  联系方式占位锁定（ASM-021/INV-03）、未登录登录引导（FLOW-007）、状态非仅颜色（NFR-007）、
  信任权重高于社交信号（INV-10）、生命周期分支（PAGE-010 States）。
*/

// ── COMP-051 ModuleSummaryHeader ──────────────────────
describe("ModuleSummaryHeader（COMP-051）", () => {
  const base = {
    title: "Agent 记忆系统设计模式",
    summary: "脱敏摘要：记忆分层与检索召回的工程模式。",
    ownerHandle: "knowledge-trader",
    githubVerified: true,
    topics: ["Agent", "知识管理"],
    updatedAt: "3 天前更新",
    isAuthenticated: false,
    socialState: { favorited: false, endorsed: false, rateLimited: false },
    isOwnerViewing: false,
  };

  it("渲染唯一 h1 与脱敏摘要、Verified 文字（非仅颜色）", () => {
    render(<ModuleSummaryHeader {...base} />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Agent 记忆系统设计模式"
    );
    expect(screen.getByText(base.summary)).toBeInTheDocument();
    expect(screen.getByText("GitHub Verified")).toBeInTheDocument();
  });

  it("未登录点收藏触发登录引导回调而非 mutation（FLOW-007）", async () => {
    const onToggleFavorite = vi.fn();
    const onRequireLogin = vi.fn();
    render(
      <ModuleSummaryHeader
        {...base}
        onToggleFavorite={onToggleFavorite}
        onRequireLogin={onRequireLogin}
      />
    );
    await userEvent.click(screen.getByRole("button", { name: "收藏" }));
    expect(onRequireLogin).toHaveBeenCalledOnce();
    expect(onToggleFavorite).not.toHaveBeenCalled();
  });

  it("已登录点收藏触发 mutation；图标按钮有 aria-label/aria-pressed", async () => {
    const onToggleFavorite = vi.fn();
    render(
      <ModuleSummaryHeader
        {...base}
        isAuthenticated
        onToggleFavorite={onToggleFavorite}
      />
    );
    const fav = screen.getByRole("button", { name: "收藏" });
    expect(fav).toHaveAttribute("aria-pressed", "false");
    await userEvent.click(fav);
    expect(onToggleFavorite).toHaveBeenCalledOnce();
  });

  it("owner 自看时隐藏收藏/举报", () => {
    render(<ModuleSummaryHeader {...base} isOwnerViewing />);
    expect(screen.queryByRole("button", { name: "收藏" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "举报" })).not.toBeInTheDocument();
  });

  it("Verified=false 不渲染 Verified 徽", () => {
    render(<ModuleSummaryHeader {...base} githubVerified={false} />);
    expect(screen.queryByText("GitHub Verified")).not.toBeInTheDocument();
  });
});

// ── COMP-052 SourceStatsPanel ─────────────────────────
describe("SourceStatsPanel（COMP-052）", () => {
  const stats = [
    { icon: "fact_check", label: "覆盖问题", value: 3 },
    { icon: "label", label: "主题数", value: 2 },
    { icon: "swap_horiz", label: "交换次数", value: 42 },
    { icon: "favorite", label: "收藏数", value: 156 },
  ];

  it("有 source_types 时渲染环形图（含文字图例）+ 4 个 StatBlock", () => {
    render(
      <SourceStatsPanel
        sourceTypes={[
          { label: "个人笔记", ratio: 50 },
          { label: "公开文章", ratio: 50 },
        ]}
        stats={stats}
        freshness="3 天前更新"
      />
    );
    expect(screen.getByText("覆盖问题")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
    // 文字图例（非仅颜色）
    expect(screen.getAllByText("个人笔记").length).toBeGreaterThan(0);
    expect(screen.getByRole("img", { name: /来源构成/ })).toBeInTheDocument();
  });

  it("无 source_types 时隐藏环形图、仅显计数", () => {
    render(<SourceStatsPanel sourceTypes={[]} stats={stats} />);
    expect(screen.queryByRole("img", { name: /来源构成/ })).not.toBeInTheDocument();
    expect(screen.getByText("覆盖问题")).toBeInTheDocument();
  });

  it("计数为 0 时渲染 0（缺计数显 0）", () => {
    const zeroed = stats.map((s) => ({ ...s, value: 0 }));
    render(<SourceStatsPanel sourceTypes={[]} stats={zeroed} />);
    expect(screen.getAllByText("0").length).toBeGreaterThanOrEqual(4);
  });
});

// ── COMP-053 PrivacyBoundaryCard ──────────────────────
describe("PrivacyBoundaryCard（COMP-053）", () => {
  const base = {
    sensitivity: "low" as const,
    privacyGate: "pass" as const,
    gateExplanation: "隐私扫描通过：未发现需阻断的敏感内容。",
    redactionNotes: "已移除姓名、私有仓库与逐字片段。",
    auditRulesUrl: "https://example.com/rules",
    isAuthenticated: true,
  };

  it("敏感度/隐私门用文字（非仅颜色）渲染", () => {
    render(<PrivacyBoundaryCard {...base} />);
    expect(screen.getByText("低敏感度")).toBeInTheDocument();
    expect(screen.getByText("隐私扫描通过")).toBeInTheDocument();
  });

  it("无 redactionNotes 时显默认承诺文案", () => {
    render(<PrivacyBoundaryCard {...base} redactionNotes={undefined} />);
    expect(screen.getAllByText(/公开的只是脱敏清单/).length).toBeGreaterThan(0);
  });

  it("未登录点举报触发登录引导（FLOW-007）", async () => {
    const onReport = vi.fn();
    const onRequireLogin = vi.fn();
    render(
      <PrivacyBoundaryCard
        {...base}
        isAuthenticated={false}
        onReport={onReport}
        onRequireLogin={onRequireLogin}
      />
    );
    await userEvent.click(screen.getByRole("button", { name: /举报该模块/ }));
    expect(onRequireLogin).toHaveBeenCalledOnce();
    expect(onReport).not.toHaveBeenCalled();
  });
});

// ── COMP-054 ManifestPreview ──────────────────────────
describe("ManifestPreview（COMP-054）", () => {
  const manifest = {
    id: "m-agent-memory",
    title: "Agent 记忆系统设计模式",
    summary: "脱敏摘要",
    topics: ["Agent"],
    language: "zh-CN",
    owner_handle: "knowledge-trader",
    exchange_intent: "交换实践清单",
    sensitivity: "low",
    version: "v1.2.0",
    license: "CC BY-NC-SA 4.0",
    updated_at: "2026-06-20",
    // PII：必须被屏蔽（INV-03/ASM-024）
    contact: "private@example.com",
    privateUrl: "https://secret.internal/repo",
  };

  it("核心隐私断言：渲染输出绝不含 contact / 私有 URL（INV-03/04）", () => {
    const { container } = render(<ManifestPreview manifest={manifest} />);
    expect(container.textContent).not.toContain("private@example.com");
    expect(container.textContent).not.toContain("secret.internal");
    expect(container.textContent).not.toContain("contact");
    expect(container.textContent).not.toContain("privateUrl");
    // 公开字段仍在
    expect(container.textContent).toContain("m-agent-memory");
  });

  it("compact/full 切换改变可见字段（full 显 license）", async () => {
    const { container } = render(
      <ManifestPreview manifest={manifest} defaultView="compact" />
    );
    expect(container.textContent).not.toContain("CC BY-NC-SA");
    await userEvent.click(screen.getByRole("button", { name: /切换到完整视图/ }));
    expect(container.textContent).toContain("CC BY-NC-SA");
    // full 视图仍屏蔽 contact
    expect(container.textContent).not.toContain("private@example.com");
  });

  it("复制按钮有 aria-label（NFR-007）", () => {
    render(<ManifestPreview manifest={manifest} />);
    expect(screen.getByRole("button", { name: "复制代码" })).toBeInTheDocument();
  });
});

// ── COMP-055 TrustSignalAside ─────────────────────────
describe("TrustSignalAside（COMP-055）", () => {
  const owner = {
    handle: "knowledge-trader",
    githubVerified: true,
    avatarUrl: "https://avatars.example.com/knowledge-trader.png",
    joinedAt: "2023-08-01",
    creditScore: 712,
    badges: [{ type: "curator", label: "优质策展" }],
  };

  it("有信任历史显 TrustBadge + 信任解释可展开（aria-expanded）", async () => {
    render(
      <TrustSignalAside
        owner={owner}
        trustLevel="high"
        trustExplanation="信任主要来自参与方反馈，权重高于社交信号。"
        socialCounts={{ favorites: 156, endorsements: 62 }}
        hasTrustHistory
      />
    );
    expect(screen.getByText("高信任")).toBeInTheDocument();
    const explainer = screen.getByRole("button", { name: /信任如何形成/ });
    expect(explainer).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(explainer);
    expect(explainer).toHaveAttribute("aria-expanded", "true");
    expect(
      screen.getByText(/权重高于社交信号/)
    ).toBeInTheDocument();
  });

  it("无信任历史显引导文案而非 0（PAGE-014 空状态）", () => {
    render(
      <TrustSignalAside
        owner={{ ...owner, creditScore: 0 }}
        trustLevel="new"
        trustExplanation="x"
        socialCounts={{ favorites: 0, endorsements: 0 }}
        hasTrustHistory={false}
      />
    );
    expect(screen.getByText(/信任随交换积累/)).toBeInTheDocument();
  });

  it("Verified=false 不渲染 Verified 徽", () => {
    render(
      <TrustSignalAside
        owner={{ ...owner, githubVerified: false }}
        trustLevel="medium"
        trustExplanation="x"
        socialCounts={{ favorites: 1, endorsements: 1 }}
      />
    );
    expect(screen.queryByText("GitHub Verified")).not.toBeInTheDocument();
  });
});

// ── COMP-056 RequestExchangeCTA ───────────────────────
describe("RequestExchangeCTA（COMP-056）", () => {
  it("已登录非 owner 显主 CTA「请求交换」并触发回调", async () => {
    const onRequestExchange = vi.fn();
    render(
      <RequestExchangeCTA
        moduleId="m-agent-memory"
        isAuthenticated
        isOwnerViewing={false}
        onRequestExchange={onRequestExchange}
      />
    );
    await userEvent.click(screen.getByRole("button", { name: "请求交换" }));
    expect(onRequestExchange).toHaveBeenCalledOnce();
  });

  it("未登录点 CTA 触发登录引导（FLOW-007）", async () => {
    const onRequest = vi.fn();
    const onRequireLogin = vi.fn();
    render(
      <RequestExchangeCTA
        moduleId="m"
        isAuthenticated={false}
        isOwnerViewing={false}
        onRequestExchange={onRequest}
        onRequireLogin={onRequireLogin}
      />
    );
    await userEvent.click(screen.getByRole("button", { name: "请求交换" }));
    expect(onRequireLogin).toHaveBeenCalledOnce();
    expect(onRequest).not.toHaveBeenCalled();
  });

  it("owner 自看禁用 CTA（ASM-021）", () => {
    render(
      <RequestExchangeCTA moduleId="m" isAuthenticated isOwnerViewing />
    );
    expect(
      screen.getByRole("button", { name: /这是你发布的模块/ })
    ).toBeDisabled();
  });

  it("有进行中交换改为「查看进行中的交换」", () => {
    render(
      <RequestExchangeCTA
        moduleId="m"
        isAuthenticated
        isOwnerViewing={false}
        activeExchange={{ exchangeId: "EX-1" }}
      />
    );
    expect(
      screen.getByRole("button", { name: /查看进行中的交换/ })
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "请求交换" })).not.toBeInTheDocument();
  });

  it("Contact Commitment 仅占位锁定、不露真实联系方式（ASM-021/INV-03）", () => {
    const { container } = render(
      <RequestExchangeCTA
        moduleId="m"
        isAuthenticated
        isOwnerViewing={false}
      />
    );
    expect(screen.getByText(/Contact Commitment/)).toBeInTheDocument();
    expect(container.textContent).toMatch(/仅在交换被接受后/);
    expect(container.textContent).not.toContain("@example.com");
  });
});

// ── COMP-050 ModuleDetailLayout ───────────────────────
describe("ModuleDetailLayout（COMP-050）", () => {
  const slots = {
    header: <h1>标题</h1>,
    sourceStats: <div>统计</div>,
    manifest: <div>清单</div>,
    privacy: <div>隐私</div>,
    sidebar: <div>侧栏</div>,
  };

  it("Published 渲染 main + aside 语义与全部插槽", () => {
    const { container } = render(
      <ModuleDetailLayout
        lifecycleState="Published"
        isOwnerViewing={false}
        slots={slots}
      />
    );
    expect(container.querySelector("main")).toBeTruthy();
    expect(container.querySelectorAll("aside").length).toBeGreaterThan(0);
    expect(screen.getAllByText("侧栏").length).toBeGreaterThan(0);
    expect(screen.getByText("清单")).toBeInTheDocument();
  });

  it("Delisted 仅显下架占位、无 Manifest/侧栏（FR-090）", () => {
    render(
      <ModuleDetailLayout
        lifecycleState="Delisted"
        isOwnerViewing={false}
        slots={slots}
      />
    );
    expect(screen.getByText("该模块已下架")).toBeInTheDocument();
    expect(screen.queryByText("清单")).not.toBeInTheDocument();
    expect(screen.queryByText("侧栏")).not.toBeInTheDocument();
  });

  it("Draft 非 owner 不渲染内容", () => {
    render(
      <ModuleDetailLayout
        lifecycleState="Draft"
        isOwnerViewing={false}
        slots={slots}
      />
    );
    expect(screen.getByText("该模块尚未公开")).toBeInTheDocument();
    expect(screen.queryByText("清单")).not.toBeInTheDocument();
  });

  it("Draft owner 可见预览（含草稿标记）", () => {
    render(
      <ModuleDetailLayout
        lifecycleState="Draft"
        isOwnerViewing
        slots={slots}
      />
    );
    expect(screen.getByText(/草稿 · 未公开/)).toBeInTheDocument();
    expect(screen.getByText("清单")).toBeInTheDocument();
  });

  it("NotFound 显 404 占位 + 返回发现", () => {
    render(
      <ModuleDetailLayout
        lifecycleState="NotFound"
        isOwnerViewing={false}
        slots={slots}
      />
    );
    expect(screen.getByText("未找到该模块")).toBeInTheDocument();
    expect(screen.getByText("返回发现")).toBeInTheDocument();
  });
});
