import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  afterEach,
} from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { setupServer } from "msw/node";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { adminHandlers } from "@/mocks/handlers/admin";
import { AdminConsole } from "@/components/admin/admin-console";

/*
  PAGE-080~085 集成测试（自包含 setupServer(adminHandlers)）。
  覆盖：管理员权限门、队列渲染、隐私门 StatusPill、风险等级文字（非仅颜色）、
  选中行驱动详情、破坏性下架二次确认 + 原因必填、批量通过二次确认 + 排除非 pass/被举报项、
  block 行无「通过」（INV-02）、审计日志只读区分系统/人工。
*/
const server = setupServer(...adminHandlers);

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function renderConsole() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <AdminConsole />
    </QueryClientProvider>
  );
}

describe("AdminConsole（PAGE-080~085 集成）", () => {
  it("管理员可加载控制台并渲染风险摘要与队列", async () => {
    renderConsole();
    expect(
      await screen.findByRole("heading", { level: 1, name: "审核控制台" })
    ).toBeInTheDocument();
    // 管理员标识徽
    expect(await screen.findByText("管理员")).toBeInTheDocument();
    // 风险摘要四项标签（「高风险」也出现在风险等级标签，故用 getAllByText）
    expect(screen.getByText("待审")).toBeInTheDocument();
    expect(screen.getAllByText("高风险").length).toBeGreaterThan(0);
    expect(screen.getByText("今日举报")).toBeInTheDocument();
    expect(screen.getByText("已处理")).toBeInTheDocument();
    // 队列行（来自 adminHandlers fixture）
    expect(await screen.findByText("私有部署脚本集")).toBeInTheDocument();
    expect(screen.getByText("AI 产品增长实验库")).toBeInTheDocument();
  });

  it("隐私门以 StatusPill 文字呈现，风险等级有文字（非仅颜色 NFR-007）", async () => {
    renderConsole();
    await screen.findByText("私有部署脚本集");
    // 隐私门三态文字
    expect(screen.getByText("阻止发布")).toBeInTheDocument(); // block
    expect(screen.getByText("通过")).toBeInTheDocument(); // pass
    expect(screen.getByText("警告")).toBeInTheDocument(); // warn
    // 风险等级文字词（「高风险」与摘要标签重名，用 getAllByText）
    expect(screen.getAllByText("高风险").length).toBeGreaterThan(0);
    expect(screen.getByText("无风险")).toBeInTheDocument(); // pass 行等级词
    expect(screen.getByText("中风险")).toBeInTheDocument();
  });

  it("选中 pass 行驱动详情面板并显示 Manifest 摘要与处置区", async () => {
    renderConsole();
    const passRow = await screen.findByText("AI 产品增长实验库");
    await userEvent.click(passRow);
    // 详情标题
    expect(
      await screen.findByText("正在查看：AI 产品增长实验库")
    ).toBeInTheDocument();
    // Manifest 摘要等宽块（脱敏标签）
    expect(screen.getByText("manifest.json（脱敏）")).toBeInTheDocument();
    // pass 行有「通过」动作
    expect(screen.getByRole("button", { name: "通过" })).toBeInTheDocument();
  });

  it("block 行不渲染「通过」动作（INV-02）", async () => {
    renderConsole();
    const blockRow = await screen.findByText("私有部署脚本集");
    await userEvent.click(blockRow);
    await screen.findByText("正在查看：私有部署脚本集");
    expect(screen.queryByRole("button", { name: "通过" })).not.toBeInTheDocument();
    // 仍有「退回」与「下架」
    expect(
      screen.getByRole("button", { name: "退回 / 要求修改" })
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "下架" })).toBeInTheDocument();
  });

  it("下架破坏性操作触发二次确认，且原因必填（ASM-051）", async () => {
    renderConsole();
    const blockRow = await screen.findByText("私有部署脚本集");
    await userEvent.click(blockRow);
    await screen.findByText("正在查看：私有部署脚本集");

    await userEvent.click(screen.getByRole("button", { name: "下架" }));

    // 二次确认对话框出现
    const dialog = await screen.findByRole("alertdialog");
    expect(within(dialog).getByText("下架模块")).toBeInTheDocument();
    // 原因未填 → 确认禁用
    const confirmBtn = within(dialog).getByRole("button", { name: "确认下架" });
    expect(confirmBtn).toBeDisabled();
  });

  it("退回未填原因时按钮禁用（处置原因必填，INV-11）", async () => {
    renderConsole();
    const passRow = await screen.findByText("AI 产品增长实验库");
    await userEvent.click(passRow);
    await screen.findByText("正在查看：AI 产品增长实验库");
    expect(
      screen.getByRole("button", { name: "退回 / 要求修改" })
    ).toBeDisabled();
  });

  it("批量通过触发二次确认且仅作用于 pass 且无未决举报子集（INV-02/ASM-050）", async () => {
    renderConsole();
    await screen.findByText("私有部署脚本集");
    // fixture：仅 rv-2(pass, 未举报) 可批量；rv-1(block)、rv-3(warn+举报) 排除 → 计数 1
    const bulkBtn = await screen.findByRole("button", {
      name: /批量通过（1）/,
    });
    await userEvent.click(bulkBtn);
    const dialog = await screen.findByRole("alertdialog");
    expect(within(dialog).getByText("批量通过")).toBeInTheDocument();
    expect(
      within(dialog).getByText(/将批量通过 1 项/)
    ).toBeInTheDocument();
  });

  it("审计日志只读，区分系统与人工行动者", async () => {
    renderConsole();
    expect(
      await screen.findByRole("heading", { name: "审计日志" })
    ).toBeInTheDocument();
    const auditList = await screen.findByRole("list", { name: "审计日志" });
    expect(within(auditList).getByText("系统")).toBeInTheDocument();
    expect(within(auditList).getAllByText("人工").length).toBeGreaterThan(0);
  });
});
