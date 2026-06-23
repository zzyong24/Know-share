import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  ZeroLeakBanner,
  ApiCategoryNav,
  EndpointCard,
  AuthBadge,
  AuthNoteBlock,
  DeveloperResourceCard,
  EndpointFieldTable,
  RateLimitNote,
  StatsTeaser,
  ApiDocsEmptyState,
  OpenApiView,
} from "@/components/open-api";
import {
  API_CATEGORIES,
  API_ENDPOINTS,
  DEVELOPER_RESOURCES,
  STATS_TEASER_MOCK,
  WRITE_OP_POINTS,
} from "@/mocks/fixtures/open-api";

const GET_MODULES = API_ENDPOINTS.find((e) => e.id === "modules-list")!;
const POST_EXCHANGE = API_ENDPOINTS.find((e) => e.id === "exchanges-create")!;

beforeEach(() => {
  // jsdom 无 clipboard：提供桩
  Object.assign(navigator, {
    clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
  });
});

// ── COMP-190 ZeroLeakBanner ─────────────────────────────
describe("ZeroLeakBanner（COMP-190）", () => {
  it("承诺文案含「不返回原始知识内容或私有 URL」", () => {
    render(<ZeroLeakBanner />);
    expect(
      screen.getByText(/绝不返回原始知识内容或私有 URL/)
    ).toBeInTheDocument();
  });
  it("不含归一化移除的「加密网关」字样（归一项 1 回归）", () => {
    const { container } = render(<ZeroLeakBanner />);
    expect(container.textContent).not.toMatch(/加密网关/);
  });
  it("不渲染任何 contact / 私有 URL（INV-04）", () => {
    const { container } = render(<ZeroLeakBanner />);
    expect(container.textContent).not.toMatch(/contact/i);
  });
});

// ── COMP-191 ApiCategoryNav ─────────────────────────────
describe("ApiCategoryNav（COMP-191）", () => {
  it("5 类齐全且 label 为简体中文", () => {
    render(<ApiCategoryNav categories={API_CATEGORIES} />);
    ["发现", "模块", "交换", "反馈", "统计"].forEach((label) => {
      expect(screen.getByText(label)).toBeInTheDocument();
    });
  });
  it("当前项设 aria-current 且非仅颜色（结构标记在场）", () => {
    render(<ApiCategoryNav categories={API_CATEGORIES} activeId="modules" />);
    const current = screen.getByText("模块").closest("a")!;
    expect(current).toHaveAttribute("aria-current", "true");
  });
  it("点击触发 onNavigate", async () => {
    const onNavigate = vi.fn();
    render(
      <ApiCategoryNav categories={API_CATEGORIES} onNavigate={onNavigate} />
    );
    await userEvent.click(screen.getByText("交换"));
    expect(onNavigate).toHaveBeenCalledWith("exchanges");
  });
});

// ── COMP-192 EndpointCard ───────────────────────────────
describe("EndpointCard（COMP-192）", () => {
  it("GET 卡标「公开读」", () => {
    render(<EndpointCard endpoint={GET_MODULES} />);
    expect(screen.getByText("公开读")).toBeInTheDocument();
  });
  it("POST 卡标「需 GitHub 认证 + 同意门」，无「公开写」", () => {
    const { container } = render(<EndpointCard endpoint={POST_EXCHANGE} />);
    expect(screen.getByText("需 GitHub 认证 + 同意门")).toBeInTheDocument();
    expect(container.textContent).not.toMatch(/公开写/);
  });
  it("方法名文字始终渲染（非仅颜色，NFR-007）", () => {
    render(<EndpointCard endpoint={GET_MODULES} />);
    expect(screen.getByText("GET")).toBeInTheDocument();
  });
  it("展开/收起切换 aria-expanded", async () => {
    render(<EndpointCard endpoint={GET_MODULES} defaultExpanded={false} />);
    const toggle = screen.getByRole("button", { name: /展开 GET/ });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(toggle);
    expect(
      screen.getByRole("button", { name: /收起 GET/ })
    ).toHaveAttribute("aria-expanded", "true");
  });
  it("展开后响应示例 JSON 不含 contact / 私有 URL（INV-04 内容不变量）", async () => {
    const { container } = render(
      <EndpointCard endpoint={GET_MODULES} defaultExpanded />
    );
    expect(container.textContent).not.toMatch(/contact/i);
    expect(container.textContent).not.toMatch(/https?:\/\/(?!github)/);
  });
  it("公开读卡渲染速率限制说明（FR-110）", () => {
    render(<EndpointCard endpoint={GET_MODULES} />);
    expect(screen.getByText(/速率限制/)).toBeInTheDocument();
  });
  it("POST 卡展开后渲染写操作要求块、不渲染任何提交/写表单", async () => {
    render(<EndpointCard endpoint={POST_EXCHANGE} defaultExpanded />);
    expect(screen.getByText("写操作要求")).toBeInTheDocument();
    // 不越同意门：无任何文本输入框 / submit 按钮
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /提交|发送|发起/ })
    ).not.toBeInTheDocument();
  });
  it("点深链复制按钮调用 clipboard", async () => {
    render(<EndpointCard endpoint={GET_MODULES} />);
    await userEvent.click(
      screen.getByRole("button", { name: /复制 GET .* 的深链/ })
    );
    expect(navigator.clipboard.writeText).toHaveBeenCalled();
  });
});

// ── COMP-193 AuthBadge ──────────────────────────────────
describe("AuthBadge（COMP-193）", () => {
  it("auth-write 渲染含「需 GitHub 认证 + 同意门」文字", () => {
    render(<AuthBadge kind="auth-write" />);
    expect(screen.getByText("需 GitHub 认证 + 同意门")).toBeInTheDocument();
  });
  it("public-read 渲染「公开读」文字（语义非仅颜色）", () => {
    render(<AuthBadge kind="public-read" />);
    expect(screen.getByText("公开读")).toBeInTheDocument();
  });
});

// ── COMP-194 AuthNoteBlock ──────────────────────────────
describe("AuthNoteBlock（COMP-194）", () => {
  it("渲染含「GitHub」「同意门」要点", () => {
    render(<AuthNoteBlock points={WRITE_OP_POINTS} />);
    expect(screen.getByText(/GitHub/)).toBeInTheDocument();
    expect(screen.getByText(/同意门/)).toBeInTheDocument();
  });
  it("不渲染任何提交/写按钮或输入框（不越 NFR-005 同意门）", () => {
    render(<AuthNoteBlock points={WRITE_OP_POINTS} />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });
  it("要点为语义列表", () => {
    render(<AuthNoteBlock points={WRITE_OP_POINTS} />);
    expect(screen.getAllByRole("listitem").length).toBe(WRITE_OP_POINTS.length);
  });
});

// ── COMP-195 DeveloperResourceCard ──────────────────────
describe("DeveloperResourceCard（COMP-195）", () => {
  it("不含「企业级/付费/申请访问/计费」字样（DEC-007 回归）", () => {
    const { container } = render(
      <DeveloperResourceCard links={DEVELOPER_RESOURCES} />
    );
    expect(container.textContent).not.toMatch(
      /企业级|付费|申请访问|计费|企业访问/
    );
  });
  it("外链带 rel=noopener noreferrer + target=_blank + 新标签页提示", () => {
    render(<DeveloperResourceCard links={DEVELOPER_RESOURCES} />);
    const ext = screen.getByRole("link", { name: /查看仓库与示例/ });
    expect(ext).toHaveAttribute("target", "_blank");
    expect(ext).toHaveAttribute("rel", "noopener noreferrer");
    expect(ext.getAttribute("aria-label")).toMatch(/新标签页/);
  });
});

// ── COMP-196 EndpointFieldTable ─────────────────────────
describe("EndpointFieldTable（COMP-196）", () => {
  it("/api/modules 字段表逐字段追溯，trust_level 标「派生」", () => {
    render(<EndpointFieldTable rows={GET_MODULES.fields} />);
    expect(screen.getByText("trust_level")).toBeInTheDocument();
    expect(screen.getByText(/派生 ENT-011/)).toBeInTheDocument();
  });
  it("字段表不含 contact 行（INV-03 / ASM-055）", () => {
    const { container } = render(
      <EndpointFieldTable rows={GET_MODULES.fields} />
    );
    expect(container.textContent).not.toMatch(/contact/i);
  });
  it("表头用 th scope=col 关联（NFR-007）", () => {
    render(<EndpointFieldTable rows={GET_MODULES.fields} />);
    const headers = screen.getAllByRole("columnheader");
    expect(headers.length).toBe(4);
    headers.forEach((h) => expect(h).toHaveAttribute("scope", "col"));
  });
});

// ── COMP-197 RateLimitNote ──────────────────────────────
describe("RateLimitNote（COMP-197）", () => {
  it("渲染含「速率限制」文字", () => {
    render(<RateLimitNote />);
    expect(screen.getByText(/速率限制/)).toBeInTheDocument();
  });
  it("默认不含具体数字阈值（ASM-057）", () => {
    const { container } = render(<RateLimitNote />);
    expect(container.textContent).not.toMatch(/\d+\s*(次|req|\/)/);
  });
});

// ── COMP-198 StatsTeaser ────────────────────────────────
describe("StatsTeaser（COMP-198）", () => {
  it("仅渲染聚合指标且数字有文字标签（NFR-007）", () => {
    render(<StatsTeaser metrics={STATS_TEASER_MOCK} />);
    expect(screen.getByText("用户总数")).toBeInTheDocument();
    expect(screen.getByText("模块总数")).toBeInTheDocument();
    expect(screen.getByText("隐私门通过率")).toBeInTheDocument();
  });
  it("无 PII 字段（INV-09）", () => {
    const { container } = render(<StatsTeaser metrics={STATS_TEASER_MOCK} />);
    expect(container.textContent).not.toMatch(/contact|email|@|手机|电话/i);
  });
  it("失败回退中性占位且不抛错（降级不阻断）", () => {
    render(<StatsTeaser metrics={undefined} />);
    expect(screen.getByText("统计暂不可用")).toBeInTheDocument();
  });
  it("loading 用 Skeleton + aria-busy", () => {
    const { container } = render(<StatsTeaser loading />);
    expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument();
  });
});

// ── COMP-199 ApiDocsEmptyState ──────────────────────────
describe("ApiDocsEmptyState（COMP-199）", () => {
  it("渲染说明 + CTA 指向仓库/帮助", () => {
    render(<ApiDocsEmptyState />);
    expect(screen.getByText(/文档加载失败/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /访问仓库/ })).toHaveAttribute(
      "href",
      "/about"
    );
  });
});

// ── PAGE-090 OpenApiView 集成 ───────────────────────────
describe("OpenApiView（PAGE-090）", () => {
  it("渲染承诺横幅 + 分类导航 + 全部端点", () => {
    render(<OpenApiView />);
    expect(screen.getByText(/零私有内容泄露/)).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "API 分类" })).toBeInTheDocument();
    // 6 个端点路径均出现
    API_ENDPOINTS.forEach((e) => {
      expect(screen.getAllByText(e.path).length).toBeGreaterThan(0);
    });
  });
  it("至少含规格要求的 6 个端点", () => {
    expect(API_ENDPOINTS.length).toBeGreaterThanOrEqual(6);
  });
  it("首端点默认展开、其余收起（PAGE-090 States）", () => {
    render(<OpenApiView />);
    // 首卡（GET /api/modules）展开按钮 aria-expanded=true
    expect(
      screen.getByRole("button", { name: /收起 GET \/api\/modules/ })
    ).toBeInTheDocument();
    // 第二端点（GET /api/modules/{id}）默认收起
    expect(
      screen.getByRole("button", { name: /展开 GET \/api\/modules\/\{id\}/ })
    ).toBeInTheDocument();
  });
  it("整页不输出任何 contact 字段（INV-01/04 / ASM-055，全端点展开）", () => {
    // 全部展开后核验：渲染所有端点卡的展开态
    const { container } = render(
      <>
        {API_ENDPOINTS.map((e) => (
          <EndpointCard key={e.id} endpoint={e} defaultExpanded />
        ))}
      </>
    );
    expect(container.textContent).not.toMatch(/contact/i);
  });
  it("空端点配置时回退空态（PAGE-090 States「空状态」）", () => {
    render(<OpenApiView endpoints={[]} />);
    expect(screen.getByText(/文档加载失败/)).toBeInTheDocument();
  });
  it("所有 GET 标公开读、所有 POST 标需认证写，无公开写（验收 3）", () => {
    const { container } = render(
      <>
        {API_ENDPOINTS.map((e) => (
          <EndpointCard key={e.id} endpoint={e} />
        ))}
      </>
    );
    expect(container.textContent).not.toMatch(/公开写/);
    // 每个 POST 端点都有「需 GitHub 认证 + 同意门」
    const posts = API_ENDPOINTS.filter((e) => e.method === "POST");
    expect(screen.getAllByText("需 GitHub 认证 + 同意门").length).toBe(
      posts.length
    );
  });
});

// ── fixtures 内容不变量（数据层硬约束） ──────────────────
describe("open-api fixtures 内容不变量", () => {
  it("任何端点响应/请求示例都不含 contact 字段（递归，ASM-055/INV-03）", () => {
    const hasContact = (obj: unknown): boolean => {
      if (!obj || typeof obj !== "object") return false;
      if (Array.isArray(obj)) return obj.some(hasContact);
      const rec = obj as Record<string, unknown>;
      if ("contact" in rec || "contactInfo" in rec) return true;
      return Object.values(rec).some(hasContact);
    };
    API_ENDPOINTS.forEach((e) => {
      expect(hasContact(e.responseExample)).toBe(false);
      if (e.requestExample) expect(hasContact(e.requestExample)).toBe(false);
    });
  });
  it("无任何付费/企业 CTA 措辞（DEC-007）", () => {
    const blob = JSON.stringify({ DEVELOPER_RESOURCES });
    expect(blob).not.toMatch(/企业级|付费|计费|申请访问/);
  });
  it("auth 语义与方法绑定：GET→public-read、POST→auth-write（无公开写）", () => {
    API_ENDPOINTS.forEach((e) => {
      if (e.method === "GET") expect(e.auth).toBe("public-read");
      if (e.method === "POST") expect(e.auth).toBe("auth-write");
    });
  });
});
