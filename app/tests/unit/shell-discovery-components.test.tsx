import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  DiscoveryHero,
  DiscoveryFilters,
  SortControl,
  TopicChipRow,
  PlatformStatsStrip,
  SearchScopeTabs,
  SearchResultGroup,
  UserResultRow,
  ExchangeResultRow,
} from "@/components/shell-discovery";
import type {
  ExchangeResult,
  FilterOptions,
  KnowledgeModule,
  Topic,
  UserResult,
} from "@/lib/types";

const TOPICS: Topic[] = [
  { id: "t-agent", label: "Agent", moduleCount: 4 },
  { id: "t-rag", label: "RAG", moduleCount: 3 },
];

const OPTIONS: FilterOptions = {
  types: ["Published", "Draft"],
  topics: TOPICS,
  trustLevels: ["high", "medium", "low", "new"],
};

const MODULE: KnowledgeModule = {
  id: "m-1",
  title: "Agent 记忆系统",
  summary: "脱敏摘要",
  topics: ["Agent"],
  sourceStats: { notes: 1, links: 1, files: 1, words: 1000 },
  trustLevel: "high",
  status: "Published",
  exchangeCount: 1,
  favoriteCount: 1,
  freshness: "今天",
  ownerLogin: "zyongzhu24",
};

// ── COMP-041 ──────────────────────────────────────────
describe("DiscoveryHero（COMP-041）", () => {
  it("渲染唯一 h1 与默认主张", () => {
    render(<DiscoveryHero />);
    const h1 = screen.getByRole("heading", { level: 1 });
    expect(h1).toHaveTextContent("让 Agent 帮你发现");
  });
  it("无 subtitle 时不渲染段落", () => {
    render(<DiscoveryHero subtitle="" />);
    expect(screen.queryByText(/浏览脱敏清单/)).not.toBeInTheDocument();
  });
});

// ── COMP-042 ──────────────────────────────────────────
describe("DiscoveryFilters（COMP-042）", () => {
  it("切换类型触发 onChange 携带正确 FilterValue", async () => {
    const onChange = vi.fn();
    render(
      <DiscoveryFilters
        value={{}}
        options={OPTIONS}
        onChange={onChange}
        onClear={vi.fn()}
      />
    );
    await userEvent.click(screen.getByText("已发布"));
    expect(onChange).toHaveBeenCalledWith({ type: ["Published"] });
  });

  it("有已选项时渲染清除筛选并触发 onClear", async () => {
    const onClear = vi.fn();
    render(
      <DiscoveryFilters
        value={{ verifiedOnly: true }}
        options={OPTIONS}
        onChange={vi.fn()}
        onClear={onClear}
      />
    );
    await userEvent.click(screen.getByRole("button", { name: /清除筛选/ }));
    expect(onClear).toHaveBeenCalled();
  });

  it("选中态非仅颜色：含勾选 checkbox 选中", () => {
    render(
      <DiscoveryFilters
        value={{ verifiedOnly: true }}
        options={OPTIONS}
        onChange={vi.fn()}
        onClear={vi.fn()}
      />
    );
    const cb = screen.getByRole("checkbox", { name: /仅 GitHub Verified/ });
    expect(cb).toBeChecked();
  });
});

// ── COMP-043 ──────────────────────────────────────────
describe("SortControl（COMP-043）", () => {
  it("切换排序触发 onChange 携带 SortKey", async () => {
    const onChange = vi.fn();
    render(<SortControl value="relevance" onChange={onChange} />);
    await userEvent.click(screen.getByRole("radio", { name: "最热门" }));
    expect(onChange).toHaveBeenCalledWith("popular");
  });
  it("当前项 aria-checked", () => {
    render(<SortControl value="trust" onChange={vi.fn()} />);
    expect(screen.getByRole("radio", { name: "信任分" })).toBeChecked();
  });
  it("非法 value 回退首项不抛错", () => {
    render(<SortControl value={"bogus" as never} onChange={vi.fn()} />);
    expect(screen.getByRole("radio", { name: "相关度" })).toBeChecked();
  });
});

// ── COMP-044 ──────────────────────────────────────────
describe("TopicChipRow（COMP-044）", () => {
  it("点击主题触发 onSelect 携带 label", async () => {
    const onSelect = vi.fn();
    render(<TopicChipRow topics={TOPICS} onSelect={onSelect} />);
    await userEvent.click(screen.getByRole("button", { name: /Agent/ }));
    expect(onSelect).toHaveBeenCalledWith("Agent");
  });
  it("空集合不渲染容器", () => {
    const { container } = render(<TopicChipRow topics={[]} onSelect={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });
  it("selected 主题渲染选中态（aria-pressed）", () => {
    render(<TopicChipRow topics={TOPICS} selected={["Agent"]} onSelect={vi.fn()} />);
    expect(screen.getByRole("button", { name: /Agent/ })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
  });
});

// ── COMP-045 ──────────────────────────────────────────
describe("PlatformStatsStrip（COMP-045）", () => {
  it("渲染 4 个统计且千分位格式化", () => {
    render(
      <PlatformStatsStrip
        stats={{ modules: 1842, exchanges: 12857, activeUsers: 2196, privacyPassRate: 98.6 }}
      />
    );
    expect(screen.getByText("1,842")).toBeInTheDocument();
    expect(screen.getByText("12,857")).toBeInTheDocument();
    expect(screen.getByText("98.6%")).toBeInTheDocument();
    expect(screen.getByText("隐私门通过率")).toBeInTheDocument();
  });
  it("error 时静默隐藏不抛错", () => {
    const { container } = render(<PlatformStatsStrip error />);
    expect(container).toBeEmptyDOMElement();
  });
  it("说明卡『了解更多』指向 /about", () => {
    render(
      <PlatformStatsStrip
        stats={{ modules: 1, exchanges: 1, activeUsers: 1, privacyPassRate: 50 }}
        notes={[{ title: "为什么选我们", body: "x", href: "/about" }]}
      />
    );
    expect(screen.getByRole("link", { name: "了解更多" })).toHaveAttribute(
      "href",
      "/about"
    );
  });
});

// ── COMP-046 ──────────────────────────────────────────
describe("SearchScopeTabs（COMP-046）", () => {
  it("切换 Tab 触发 onChange 携带 SearchScope", async () => {
    const onChange = vi.fn();
    render(
      <SearchScopeTabs value="all" counts={{ modules: 2 }} onChange={onChange} />
    );
    await userEvent.click(screen.getByRole("tab", { name: /模块/ }));
    expect(onChange).toHaveBeenCalledWith("modules");
  });
  it("当前 Tab aria-selected", () => {
    render(<SearchScopeTabs value="users" onChange={vi.fn()} />);
    expect(screen.getByRole("tab", { name: "用户" })).toHaveAttribute(
      "aria-selected",
      "true"
    );
  });
});

// ── COMP-047 ──────────────────────────────────────────
describe("SearchResultGroup（COMP-047）", () => {
  it("modules scope 渲染 ModuleCard", () => {
    render(<SearchResultGroup scope="modules" title="模块结果" items={[MODULE]} />);
    expect(screen.getByText("Agent 记忆系统")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /模块结果/ })).toBeInTheDocument();
  });
  it("error 渲染重试不抛错", async () => {
    const onRetry = vi.fn();
    render(
      <SearchResultGroup scope="users" title="用户结果" items={[]} error onRetry={onRetry} />
    );
    await userEvent.click(screen.getByRole("button", { name: "重试" }));
    expect(onRetry).toHaveBeenCalled();
  });
  it("hasMore 渲染加载更多并触发 onLoadMore", async () => {
    const onLoadMore = vi.fn();
    render(
      <SearchResultGroup
        scope="modules"
        title="模块结果"
        items={[MODULE]}
        hasMore
        onLoadMore={onLoadMore}
      />
    );
    await userEvent.click(screen.getByRole("button", { name: "加载更多" }));
    expect(onLoadMore).toHaveBeenCalled();
  });
});

// ── COMP-048 ──────────────────────────────────────────
describe("UserResultRow（COMP-048）", () => {
  const user: UserResult = {
    login: "zyongzhu24",
    avatarUrl: "https://x/y.png",
    githubVerified: true,
    trustScore: 824,
    domainTags: ["AI 产品"],
  };
  it("渲染用户名 + Verified 药丸 + 链接到档案", () => {
    render(
      <ul>
        <UserResultRow user={user} />
      </ul>
    );
    expect(screen.getByText("@zyongzhu24")).toBeInTheDocument();
    expect(screen.getByText("GitHub Verified")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "@zyongzhu24" })).toHaveAttribute(
      "href",
      "/u/zyongzhu24"
    );
  });
  it("无 Verified 时不渲染 Verified 药丸", () => {
    render(
      <ul>
        <UserResultRow user={{ ...user, githubVerified: false }} />
      </ul>
    );
    expect(screen.queryByText("GitHub Verified")).not.toBeInTheDocument();
  });
  it("注入联系方式字段时被白名单丢弃（INV-04）", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const dirty = { ...user, contact: "z@example.com" } as UserResult;
    render(
      <ul>
        <UserResultRow user={dirty} />
      </ul>
    );
    expect(screen.queryByText("z@example.com")).not.toBeInTheDocument();
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});

// ── COMP-049 ──────────────────────────────────────────
describe("ExchangeResultRow（COMP-049）", () => {
  const ex: ExchangeResult = {
    id: "EX-2024-8842",
    direction: "outgoing",
    status: "Accepted",
    updatedAt: "2026-06-22T09:00:00Z",
    targetModuleTitle: "多模态 RAG 检索流水线",
  };
  it("渲染方向 + 状态药丸 + 链接", () => {
    render(
      <ul>
        <ExchangeResultRow exchange={ex} />
      </ul>
    );
    expect(screen.getByText("多模态 RAG 检索流水线")).toBeInTheDocument();
    expect(screen.getByText("已接受")).toBeInTheDocument();
    expect(screen.getByText("发起")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /多模态 RAG/ })
    ).toHaveAttribute("href", "/exchanges/EX-2024-8842");
  });
  it("时间含绝对 title（datetime）", () => {
    const { container } = render(
      <ul>
        <ExchangeResultRow exchange={ex} />
      </ul>
    );
    const time = container.querySelector("time");
    expect(time).toHaveAttribute("datetime", "2026-06-22T09:00:00Z");
  });
  it("注入私有 URL 字段时被白名单丢弃（INV-04）", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const dirty = { ...ex, privateUrl: "https://secret" } as ExchangeResult;
    const { container } = render(
      <ul>
        <ExchangeResultRow exchange={dirty} />
      </ul>
    );
    expect(within(container).queryByText("https://secret")).not.toBeInTheDocument();
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});
