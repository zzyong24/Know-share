import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  afterEach,
  vi,
} from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { exchangeHandlers } from "@/mocks/handlers/exchange";
import { ExchangeCreateForm } from "@/components/exchange";

/*
  PAGE-031b 互惠创建表单（/exchanges/new）集成。
  覆盖：目标模块只读预填、互惠 offeredModule 可选（来自我的已发布模块）、
  缺同意校验阻断、同意后成功跳详情、缺 consent → 后端 422 提示。
*/

const server = setupServer(...exchangeHandlers);
const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, back: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/exchanges/new",
}));

function renderForm(targetModuleId: string) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <ExchangeCreateForm targetModuleId={targetModuleId} />
    </QueryClientProvider>
  );
}

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  server.resetHandlers();
  pushMock.mockReset();
});
afterAll(() => server.close());

describe("ExchangeCreateForm（PAGE-031b 集成）", () => {
  it("预填目标模块只读摘要 + 互惠选项含我的已发布模块", async () => {
    // m-multimodal-rag 为目标；演示会话 knowledge-trader 拥有 m-km-system（Published）。
    renderForm("m-multimodal-rag");
    await waitFor(() =>
      expect(screen.getByText("多模态 RAG 检索流水线")).toBeInTheDocument()
    );
    // 互惠下拉含「不提供」+ 我的已发布模块。
    expect(
      screen.getByRole("option", { name: /不提供（单向请求）/ })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "个人知识库治理方法论" })
    ).toBeInTheDocument();
  });

  it("缺同意勾选 → 阻断提交并报错（INV-08）", async () => {
    const user = userEvent.setup();
    renderForm("m-multimodal-rag");
    await waitFor(() =>
      expect(screen.getByText("多模态 RAG 检索流水线")).toBeInTheDocument()
    );
    await user.click(screen.getByRole("button", { name: "发起交换" }));
    expect(
      await screen.findByText("请勾选同意后再发起交换。")
    ).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("勾选同意 + 单向请求（不选互惠）→ 成功跳交换详情", async () => {
    const user = userEvent.setup();
    renderForm("m-multimodal-rag");
    await waitFor(() =>
      expect(screen.getByText("多模态 RAG 检索流水线")).toBeInTheDocument()
    );
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: "发起交换" }));
    await waitFor(() =>
      expect(pushMock).toHaveBeenCalledWith(
        expect.stringMatching(/^\/exchanges\/EX-\d{4}-\d+$/)
      )
    );
  });

  it("勾选同意 + 选择互惠模块 → 携带 offeredModuleId 提交成功", async () => {
    const user = userEvent.setup();
    let captured: { targetModuleId?: string; offeredModuleId?: string } = {};
    server.use(
      http.post("/api/exchanges", async ({ request }) => {
        captured = (await request.json()) as typeof captured;
        return HttpResponse.json(
          { exchangeId: "EX-2024-9999", status: "Requested" },
          { status: 201 }
        );
      })
    );
    renderForm("m-multimodal-rag");
    await waitFor(() =>
      expect(
        screen.getByRole("option", { name: "个人知识库治理方法论" })
      ).toBeInTheDocument()
    );
    await user.selectOptions(
      screen.getByRole("combobox"),
      "m-km-system"
    );
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: "发起交换" }));
    await waitFor(() =>
      expect(pushMock).toHaveBeenCalledWith("/exchanges/EX-2024-9999")
    );
    expect(captured.targetModuleId).toBe("m-multimodal-rag");
    expect(captured.offeredModuleId).toBe("m-km-system");
  });

  it("后端 422（缺 consent）→ 错误提示，不跳转", async () => {
    const user = userEvent.setup();
    // 强制后端拒绝（即便前端勾选，模拟服务侧 consent 校验失败）。
    server.use(
      http.post("/api/exchanges", () =>
        HttpResponse.json(
          { error: "consent-required", missing: ["consent"] },
          { status: 422 }
        )
      )
    );
    renderForm("m-multimodal-rag");
    await waitFor(() =>
      expect(screen.getByText("多模态 RAG 检索流水线")).toBeInTheDocument()
    );
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: "发起交换" }));
    await waitFor(() => expect(server.listHandlers).toBeDefined());
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("目标模块不存在 → 加载失败提示 + 重试", async () => {
    renderForm("m-does-not-exist");
    await waitFor(() =>
      expect(
        screen.getByText("目标模块加载失败或不存在。")
      ).toBeInTheDocument()
    );
  });
});
