import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  afterEach,
  vi,
} from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { aboutHandlers } from "@/mocks/handlers/about";
import { AboutView } from "@/components/about/AboutView";
import { AboutHero } from "@/components/about/AboutHero";
import { PlatformStatsSection } from "@/components/about/PlatformStatsSection";
import { PrivacyTrustCards } from "@/components/about/PrivacyTrustCards";
import { AboutFaq } from "@/components/about/AboutFaq";
import { AuditLinkRow } from "@/components/about/AuditLinkRow";

/*
  关于模块单测（PAGE-100~105 / COMP-210~214）。自包含：自带 setupServer(aboutHandlers)。
  覆盖：Hero 外链/漂移守卫、统计四态+区块隔离+百分比越界、隐私卡漂移守卫、FAQ 键盘可达+空态、
  审计链接双载体+死链处置、整页编排。
*/

// next/navigation（Link 等）mock —— Hero/FAQ 用 <a>，PrivacyTrustCards 用 next/link。
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/about",
}));

// 漂移守卫禁词（NFR-003 / NFR-001）。
const DRIFT_TERMS = [
  "链上",
  "区块链",
  "不可篡改",
  "E2EE",
  "端到端加密",
  "语义向量",
  "嵌入向量",
  "512 Nodes",
];

const server = setupServer(...aboutHandlers);

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function renderWithClient(ui: React.ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>{ui}</QueryClientProvider>
  );
}

// ── COMP-210 AboutHero ────────────────────────────────────
describe("AboutHero（COMP-210 / PAGE-101）", () => {
  it("渲染开源徽与「在 GitHub 查看仓库」外链（target=_blank + rel=noopener noreferrer）", () => {
    render(
      <AboutHero
        tagline="理念标题"
        subcopy="理念副文案"
        repoUrl="https://github.com/example/repo"
      />
    );
    expect(screen.getByText(/开源/)).toBeInTheDocument();
    const link = screen.getByRole("link", { name: /在 GitHub 查看.*仓库/ });
    expect(link).toHaveAttribute("href", "https://github.com/example/repo");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("decorativeStat 默认 null：不渲染硬编码「512 Nodes」", () => {
    const { container } = render(
      <AboutHero tagline="t" subcopy="s" repoUrl="https://x/y" />
    );
    expect(container.textContent).not.toMatch(/512/);
  });

  it("文案漂移守卫：不含链上 / 区块链 / E2EE 等措辞", () => {
    const { container } = render(
      <AboutHero
        tagline="让 Agent 帮你发现值得互换的知识库模块"
        subcopy="隐私优先、开源可审计，原始内容留在你本地。"
        repoUrl="https://x/y"
      />
    );
    for (const term of DRIFT_TERMS) {
      expect(container.textContent).not.toContain(term);
    }
  });
});

// ── COMP-211 PlatformStatsSection ─────────────────────────
describe("PlatformStatsSection（COMP-211 / PAGE-102）", () => {
  const stats = {
    modulesTotal: 1842,
    exchangesTotal: 12857,
    activeUsers: 2196,
    privacyGatePassRate: 98.6,
  };
  const series = [
    { month: "1 月", value: 600 },
    { month: "2 月", value: 800 },
    { month: "11 月", value: 1442 },
  ];

  it("default：四 StatBlock 数字 + 文字标签渲染（千分位）", () => {
    render(
      <PlatformStatsSection
        status="default"
        stats={stats}
        monthlyActiveSeries={series}
        meta={{ window: "近 11 个月", calibration: "聚合" }}
      />
    );
    expect(screen.getByText("1,842")).toBeInTheDocument();
    expect(screen.getByText("12,857")).toBeInTheDocument();
    expect(screen.getByText("2,196")).toBeInTheDocument();
    expect(screen.getByText("98.6%")).toBeInTheDocument();
    expect(screen.getByText("模块总数")).toBeInTheDocument();
    expect(screen.getByText("隐私门通过率")).toBeInTheDocument();
  });

  it("LineChart 提供可读文字摘要（NFR-007）", () => {
    render(
      <PlatformStatsSection
        status="default"
        stats={stats}
        monthlyActiveSeries={series}
        meta={{ window: "近 11 个月", calibration: "聚合" }}
      />
    );
    // figure role=img 的 aria-label = summary
    const fig = screen.getByRole("img", { name: /活跃交换对整体上升/ });
    expect(fig).toBeInTheDocument();
    expect(fig.getAttribute("aria-label")).toMatch(/近 11 个月/);
  });

  it("error：区块内降级提示（文字 + 图标），不抛错", () => {
    render(
      <PlatformStatsSection
        status="error"
        stats={null}
        monthlyActiveSeries={null}
      />
    );
    expect(screen.getByText(/统计暂不可用/)).toBeInTheDocument();
    expect(screen.queryByText("1,842")).not.toBeInTheDocument();
  });

  it("empty：图表显示空摘要文案", () => {
    render(
      <PlatformStatsSection
        status="empty"
        stats={null}
        monthlyActiveSeries={[]}
      />
    );
    expect(screen.getByText(/暂无统计数据/)).toBeInTheDocument();
  });

  it("百分比越界（>100）→ 该卡降级为「—」，其余卡正常", () => {
    render(
      <PlatformStatsSection
        status="default"
        stats={{ ...stats, privacyGatePassRate: 120 }}
        monthlyActiveSeries={series}
      />
    );
    expect(screen.getByText("1,842")).toBeInTheDocument(); // 其余正常
    expect(screen.getByText("—")).toBeInTheDocument(); // 越界卡降级
    expect(screen.queryByText("120%")).not.toBeInTheDocument();
  });

  it("单字段缺失（NaN）→ 该卡显示「—」", () => {
    render(
      <PlatformStatsSection
        status="default"
        stats={{ ...stats, modulesTotal: NaN }}
        monthlyActiveSeries={series}
      />
    );
    expect(screen.getByText("—")).toBeInTheDocument();
    expect(screen.getByText("12,857")).toBeInTheDocument();
  });
});

// ── COMP-212 PrivacyTrustCards ────────────────────────────
describe("PrivacyTrustCards（COMP-212 / PAGE-103）", () => {
  it("渲染三卡：不托管原始内容 / 同意优先 / 信任如何积累", () => {
    render(<PrivacyTrustCards />);
    expect(screen.getByText("不托管原始内容")).toBeInTheDocument();
    expect(screen.getByText("同意优先")).toBeInTheDocument();
    expect(screen.getByText("信任如何积累")).toBeInTheDocument();
  });

  it("漂移守卫：卡文案不含链上 / E2EE / 语义向量等措辞", () => {
    const { container } = render(<PrivacyTrustCards />);
    for (const term of DRIFT_TERMS) {
      expect(container.textContent).not.toContain(term);
    }
  });
});

// ── COMP-213 AboutFaq ─────────────────────────────────────
describe("AboutFaq（COMP-213 / PAGE-104）", () => {
  it("≥4 项，触发器为 button 且默认 aria-expanded=false", () => {
    render(<AboutFaq />);
    const triggers = screen.getAllByRole("button");
    expect(triggers.length).toBeGreaterThanOrEqual(4);
    triggers.forEach((t) =>
      expect(t).toHaveAttribute("aria-expanded", "false")
    );
  });

  it("键盘可达：聚焦后 Enter 展开，aria-expanded 切换为 true", async () => {
    const user = userEvent.setup();
    render(<AboutFaq />);
    const trigger = screen.getByRole("button", {
      name: /会存储我的原始笔记吗/,
    });
    trigger.focus();
    expect(trigger).toHaveFocus();
    await user.keyboard("{Enter}");
    await waitFor(() =>
      expect(trigger).toHaveAttribute("aria-expanded", "true")
    );
  });

  it("漂移守卫：隐私 / 交换答案不含 E2EE / 链上（展开后核对）", async () => {
    const user = userEvent.setup();
    const { container } = render(<AboutFaq />);
    await user.click(screen.getByRole("button", { name: /交换是如何保护隐私/ }));
    await waitFor(() =>
      expect(screen.getByText(/隐私门扫描/)).toBeInTheDocument()
    );
    for (const term of DRIFT_TERMS) {
      expect(container.textContent).not.toContain(term);
    }
  });

  it("items 为空 → 渲染 EmptyState", () => {
    render(<AboutFaq items={[]} />);
    expect(screen.getByText("暂无常见问题")).toBeInTheDocument();
  });
});

// ── COMP-214 AuditLinkRow ─────────────────────────────────
describe("AuditLinkRow（COMP-214 / PAGE-105）", () => {
  it("三入口齐全：可审计规则 / 隐私模型 / 数据契约，均为可点击链接", () => {
    render(<AuditLinkRow />);
    expect(screen.getByRole("link", { name: /可审计规则/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /隐私模型/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /数据契约/ })).toBeInTheDocument();
  });

  it("available:false → 不渲染死链，标「即将开放」", () => {
    render(
      <AuditLinkRow
        links={[
          { icon: "shield", label: "隐私模型", href: "/x", available: false },
        ]}
      />
    );
    expect(screen.queryByRole("link", { name: /隐私模型/ })).toBeNull();
    expect(screen.getByText(/即将开放/)).toBeInTheDocument();
  });

  it("外链含 rel=noopener noreferrer 与新窗口 aria-label", () => {
    render(
      <AuditLinkRow
        links={[
          {
            icon: "shield",
            label: "隐私模型",
            href: "https://x/y",
            available: true,
            external: true,
          },
        ]}
      />
    );
    const link = screen.getByRole("link", { name: /隐私模型，在新窗口打开/ });
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(link).toHaveAttribute("target", "_blank");
  });
});

// ── PAGE-100 整页编排（AboutView + MSW）─────────────────────
describe("AboutView（PAGE-100 整页集成）", () => {
  it("五区块按序渲染；统计经 MSW 取数后显示聚合数字", async () => {
    renderWithClient(<AboutView />);
    // Hero
    expect(
      screen.getByRole("heading", { level: 1, name: /让 Agent 帮你发现/ })
    ).toBeInTheDocument();
    // 静态区块即时可见
    expect(screen.getByText("不托管原始内容")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /帮助 \/ 常见问题/ })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /可审计规则/ })
    ).toBeInTheDocument();
    // 统计区取数后
    await waitFor(() =>
      expect(screen.getByText("1,842")).toBeInTheDocument()
    );
    expect(screen.getByText("12,857")).toBeInTheDocument();
  });

  it("统计接口失败：统计区降级，其余区块不受影响（区块隔离）", async () => {
    server.use(
      http.get("/api/about/stats", () => new HttpResponse(null, { status: 500 }))
    );
    renderWithClient(<AboutView />);
    await waitFor(() =>
      expect(screen.getByText(/统计暂不可用/)).toBeInTheDocument()
    );
    // 其余区块仍在
    expect(screen.getByText("同意优先")).toBeInTheDocument();
    const audit = screen.getByRole("heading", { name: /可审计产物/ });
    expect(within(audit.parentElement as HTMLElement).getByText(/可审计规则/)).toBeInTheDocument();
  });
});
