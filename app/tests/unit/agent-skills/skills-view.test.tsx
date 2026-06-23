import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  afterEach,
  vi,
} from "vitest";
import {
  render,
  screen,
  waitFor,
  within,
  fireEvent,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { setupServer } from "msw/node";
import { agentSkillsHandlers } from "@/mocks/handlers/agent-skills";
import { SkillsView } from "@/components/agent-skills/SkillsView";

/*
  PAGE-050/051 页面级集成（自包含 MSW，仅挂 agentSkillsHandlers）。
  覆盖：技能卡网格渲染、IconChip 单一图标族（lucide，无第二族）、安装/示例命令区、
  适配来源 8 类、本地优先流程 6 步、点击卡片打开详情抽屉、空态、深链命中/无效。
*/

const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/skills",
}));

const server = setupServer(...agentSkillsHandlers);

function renderView(props: Parameters<typeof SkillsView>[0] = {}) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <SkillsView {...props} />
    </QueryClientProvider>
  );
}

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  server.resetHandlers();
  pushMock.mockReset();
});
afterAll(() => server.close());

describe("SkillsView（PAGE-050 集成）", () => {
  it("渲染 5 张技能卡网格与中英名", async () => {
    renderView();
    expect(
      screen.getByRole("heading", { level: 1, name: "Agent 技能" })
    ).toBeInTheDocument();

    // 卡片主体（aria-label）= 唯一识别；zhName 文本可能在示例命令区重复，故用卡片角色断言
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "查看技能详情：创建脱敏清单" })
      ).toBeInTheDocument()
    );
    // 5 个规范技能卡全部渲染
    expect(
      screen.getByRole("button", { name: "查看技能详情：内容脱敏处理" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "查看技能详情：验证清单合规" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "查看技能详情：打包私有仓库" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "查看技能详情：提交反馈信用" })
    ).toBeInTheDocument();

    // 网格语义：列表项数量
    const grid = screen.getAllByRole("list");
    expect(grid.length).toBeGreaterThan(0);
  });

  it("runLocation 标签为文字+色（非仅颜色，NFR-007）", async () => {
    renderView();
    await waitFor(() =>
      expect(screen.getAllByText("本地运行").length).toBeGreaterThan(0)
    );
    // submit-feedback 为平台运行
    expect(screen.getAllByText("平台运行").length).toBeGreaterThan(0);
  });

  it("IconChip 仅用单一图标族（lucide svg，无 Material 字体/无第二族）", async () => {
    const { container } = renderView();
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "查看技能详情：创建脱敏清单" })
      ).toBeInTheDocument()
    );
    // lucide 渲染 <svg class="lucide ...">；不应出现 Material Symbols 字体类或 emoji 节点
    const svgs = container.querySelectorAll("svg");
    expect(svgs.length).toBeGreaterThan(0);
    // 不存在 material-symbols 字体类（DEC-012 单一族）
    expect(container.querySelector(".material-symbols-outlined")).toBeNull();
  });

  it("渲染安装方式（mcp.json）、示例命令与 8 类适配来源", async () => {
    renderView();
    await waitFor(() =>
      expect(screen.getByText("安装方式")).toBeInTheDocument()
    );
    // mcp.json 包名占位（ASM-040）
    await waitFor(() =>
      expect(screen.getByText(/know-share-mcp/)).toBeInTheDocument()
    );
    // 示例命令含占位路径（INV-01：无真实路径）
    expect(
      screen.getByText(/know-share create-manifest --notes \.\/my-notes/)
    ).toBeInTheDocument();
    // 8 类来源
    expect(screen.getByText("Obsidian")).toBeInTheDocument();
    expect(screen.getByText("飞书文档")).toBeInTheDocument();
    expect(screen.getByText("其他自定义格式")).toBeInTheDocument();
  });

  it("渲染本地优先隐私流程 6 步", async () => {
    renderView();
    await waitFor(() =>
      expect(screen.getByText("本地优先隐私流程")).toBeInTheDocument()
    );
    expect(screen.getByText("选择知识库")).toBeInTheDocument();
    expect(screen.getByText("本地脱敏")).toBeInTheDocument();
    expect(screen.getByText("私有仓库交换")).toBeInTheDocument();
  });

  it("点击技能卡主体打开详情抽屉（PAGE-051）", async () => {
    renderView();
    const cardLabel = await screen.findByRole("button", {
      name: "查看技能详情：创建脱敏清单",
    });
    fireEvent.click(cardLabel);

    // 抽屉为 dialog，含全字段
    const dialog = await screen.findByRole("dialog");
    expect(
      within(dialog).getByText(/创建脱敏清单 \/ Create Manifest/)
    ).toBeInTheDocument();
    // ENT-016 全字段：MCP 工具名、同意要求、CLI 命令
    expect(within(dialog).getByText("create_manifest")).toBeInTheDocument();
    expect(within(dialog).getByText("同意要求")).toBeInTheDocument();
    expect(within(dialog).getByText("MCP 工具名")).toBeInTheDocument();
  });

  it("空技能目录渲染 EmptyState（区块降级）", async () => {
    const { http, HttpResponse } = await import("msw");
    server.use(
      http.get("/api/skills/catalog", () =>
        HttpResponse.json({
          skills: [],
          sources: [],
          flowSteps: [],
          exampleCommands: [],
          install: { mcpConfig: "{}", skillInstallText: "" },
          corePrinciple: { title: "原则", points: [] },
        })
      )
    );
    renderView();
    await waitFor(() =>
      expect(
        screen.getByText("技能目录加载中或暂不可用")
      ).toBeInTheDocument()
    );
  });

  it("深链命中有效 slug → 初始打开对应技能详情", async () => {
    renderView({ initialSkillSlug: "redact-knowledge" });
    const dialog = await screen.findByRole("dialog");
    expect(
      await within(dialog).findByText(/内容脱敏处理 \/ Reduct Manifest/)
    ).toBeInTheDocument();
  });

  it("深链命中无效 slug → 抽屉内空态 + 返回目录链接", async () => {
    renderView({ initialSkillSlug: "does-not-exist" });
    // 目录加载后 slug 判定无效 → 抽屉内空态（抽屉打开时背景 inert，故只断言抽屉内容）
    const dialog = await screen.findByRole("dialog");
    expect(await within(dialog).findByText("未找到该技能")).toBeInTheDocument();
    expect(
      within(dialog).getByRole("link", { name: "返回技能目录" })
    ).toBeInTheDocument();
  });
});
