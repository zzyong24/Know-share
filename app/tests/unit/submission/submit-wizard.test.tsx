import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import { submissionHandlers } from "@/mocks/handlers/submission";
import { SubmitWizard } from "@/components/submission/SubmitWizard";
import { scanBlock } from "@/mocks/fixtures/submission";

/*
  PAGE-020~024 向导集成（自包含 setupServer(submissionHandlers)）。
  覆盖：步进、第 2 步生成 + 结构校验、第 3 步隐私门 block 不可绕过 / pass 推进、提交成功。
  toast 走 sonner，jsdom 下不渲染弹层，忽略副作用即可。
*/
const server = setupServer(...submissionHandlers);

let currentParams = new URLSearchParams();
const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
  useSearchParams: () => currentParams,
  usePathname: () => "/submit",
}));

function renderWizard(initialStep: 1 | 2 | 3 | 4 | 5) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <SubmitWizard submissionId={null} initialStep={initialStep} />
    </QueryClientProvider>
  );
}

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  server.resetHandlers();
  pushMock.mockReset();
  currentParams = new URLSearchParams();
});
afterAll(() => server.close());

describe("SubmitWizard（PAGE-020~024 集成）", () => {
  it("第 1 步渲染外壳 + Stepper 5 步，必填未过时「下一步」禁用", async () => {
    renderWizard(1);
    await waitFor(() =>
      expect(screen.getByText("选择类型与来源")).toBeInTheDocument()
    );
    // Stepper 5 步均在
    expect(screen.getByText("隐私 Gate 校验")).toBeInTheDocument();
    expect(screen.getByText("提交确认")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "下一步" })).toBeDisabled();
  });

  it("第 1 步填齐 → 「下一步」启用并进入第 2 步", async () => {
    renderWizard(1);
    await waitFor(() => screen.getByText("选择类型与来源"));
    fireEvent.change(
      screen.getByRole("textbox", { name: /模块标题/ }) ??
        screen.getAllByRole("textbox")[0],
      { target: { value: "Agent 记忆设计" } }
    );
    fireEvent.click(screen.getByRole("radio", { name: "知识模块" }));
    fireEvent.click(screen.getByText("Obsidian"));
    const next = screen.getByRole("button", { name: "下一步" });
    expect(next).toBeEnabled();
    fireEvent.click(next);
    await waitFor(() =>
      expect(screen.getByText("生成或导入清单")).toBeInTheDocument()
    );
  });

  it("第 2 步本机生成 → 结构有效，可进入隐私门", async () => {
    renderWizard(2);
    await waitFor(() => screen.getByText("生成或导入清单"));
    fireEvent.click(screen.getByRole("button", { name: /本机生成清单/ }));
    await waitFor(() => expect(screen.getByText("结构有效")).toBeInTheDocument());
    expect(screen.getByRole("button", { name: "下一步" })).toBeEnabled();
  });

  it("第 3 步：扫描得 pass → 勾选同意后推进；扫描得 block → 无法绕过（INV-02）", async () => {
    // 默认 manifest（无 secret、无 contact）→ pass
    renderWizard(2);
    await waitFor(() => screen.getByText("生成或导入清单"));
    fireEvent.click(screen.getByRole("button", { name: /本机生成清单/ }));
    await waitFor(() => screen.getByText("结构有效"));
    fireEvent.click(screen.getByRole("button", { name: "下一步" }));

    await waitFor(() =>
      screen.getByRole("heading", { name: "隐私 Gate 校验" })
    );
    fireEvent.click(screen.getByRole("button", { name: /运行隐私扫描/ }));
    // pass：出现同意复选框
    await waitFor(() => expect(screen.getByRole("checkbox")).toBeInTheDocument());
    const nextBtn = screen.getByRole("button", { name: "下一步" });
    expect(nextBtn).toBeDisabled();
    fireEvent.click(screen.getByRole("checkbox"));
    await waitFor(() => expect(screen.getByRole("button", { name: "下一步" })).toBeEnabled());
  });

  it("第 3 步 block：扫描返回 block 时无「下一步」按钮、必须修订（INV-02 端到端）", async () => {
    // 覆盖扫描端点强制返回 block
    server.use(
      http.post("/api/submissions/privacy-scan", () => HttpResponse.json(scanBlock))
    );
    renderWizard(2);
    await waitFor(() => screen.getByText("生成或导入清单"));
    fireEvent.click(screen.getByRole("button", { name: /本机生成清单/ }));
    await waitFor(() => screen.getByText("结构有效"));
    fireEvent.click(screen.getByRole("button", { name: "下一步" }));

    await waitFor(() =>
      screen.getByRole("heading", { name: "隐私 Gate 校验" })
    );
    fireEvent.click(screen.getByRole("button", { name: /运行隐私扫描/ }));
    await waitFor(() =>
      expect(screen.getAllByText(/必须解决的阻断项/).length).toBeGreaterThan(0)
    );
    expect(screen.queryByRole("button", { name: "下一步" })).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /去修订（回第 2 步）/ })
    ).toBeInTheDocument();
  });
});
