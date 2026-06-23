import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Avatar } from "@/components/shared/avatar";
import { Stepper } from "@/components/shared/stepper";
import { TopicChip } from "@/components/shared/topic-chip";
import { MethodPill } from "@/components/shared/method-pill";
import { Footer } from "@/components/shared/footer";
import { LineChart } from "@/components/shared/line-chart";
import { DonutChart } from "@/components/shared/donut-chart";
import { TrustBadge } from "@/components/shared/trust-badge";
import { ListRow } from "@/components/shared/list-row";

describe("Avatar（COMP-034）", () => {
  it("verified 含可读「已验证」文本（非仅颜色）", () => {
    render(<Avatar login="zyongzhu24" verified />);
    expect(screen.getByText("已验证")).toBeInTheDocument();
  });
  it("fallback 渲染首字母大写", () => {
    render(<Avatar login="alice" />);
    expect(screen.getByText("A")).toBeInTheDocument();
  });
});

describe("Stepper（COMP-019）", () => {
  it("当前步 aria-current=step；blocked/pending 不可点", () => {
    render(
      <Stepper
        currentKey="s2"
        steps={[
          { key: "s1", label: "选类型", status: "done" },
          { key: "s2", label: "隐私门", status: "active" },
          { key: "s3", label: "预览", status: "blocked" },
        ]}
        onStepClick={() => {}}
      />
    );
    const current = screen.getByText("隐私门").closest("li");
    expect(current).toHaveAttribute("aria-current", "step");
    // done 步可点（按钮），blocked 不可点（无按钮）
    expect(screen.getByRole("button", { name: /选类型/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /预览/ })).not.toBeInTheDocument();
  });

  it("状态有文字（非仅颜色 NFR-007）", () => {
    render(
      <Stepper
        currentKey="s1"
        steps={[{ key: "s1", label: "选类型", status: "active" }]}
      />
    );
    expect(screen.getByText(/进行中/)).toBeInTheDocument();
  });
});

describe("TopicChip（COMP-022）", () => {
  it("selected 用 aria-pressed", () => {
    render(<TopicChip label="Agent" selected onClick={() => {}} />);
    expect(screen.getByRole("button", { name: /Agent/ })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
  });
  it("removable × 带 label 并触发 onRemove", async () => {
    const onRemove = vi.fn();
    render(<TopicChip label="RAG" removable onRemove={onRemove} />);
    await userEvent.click(screen.getByRole("button", { name: "移除主题 RAG" }));
    expect(onRemove).toHaveBeenCalledWith("RAG");
  });
});

describe("MethodPill（COMP-023）", () => {
  it("方法名为文字（非仅颜色）", () => {
    render(<MethodPill method="GET" />);
    expect(screen.getByText("GET")).toBeInTheDocument();
  });
});

describe("Footer（COMP-006）", () => {
  it("含 contentinfo landmark；外链带 noopener 与新窗口提示", () => {
    render(<Footer repoUrl="https://github.com/example/repo" />);
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
    const ext = screen.getByRole("link", { name: /开源仓库/ });
    expect(ext).toHaveAttribute("rel", expect.stringContaining("noopener"));
    expect(screen.getByText("（新窗口打开）")).toBeInTheDocument();
  });
});

describe("LineChart / DonutChart（COMP-017/018）", () => {
  it("LineChart 用 summary 作 role=img 摘要 + 数据表替代（NFR-007）", () => {
    render(
      <LineChart
        data={[
          { x: "1 月", y: 10 },
          { x: "2 月", y: 20 },
        ]}
        summary="信任分两月趋势：从 10 升到 20"
      />
    );
    expect(
      screen.getByRole("img", { name: /信任分两月趋势/ })
    ).toBeInTheDocument();
  });
  it("DonutChart 图例含 label + 百分比文字（非仅颜色）", () => {
    render(
      <DonutChart
        summary="构成：交换 50%，反馈 50%"
        segments={[
          { label: "交换", value: 50, tone: "primary" },
          { label: "反馈", value: 50, tone: "accent" },
        ]}
      />
    );
    // 图例文字 + 百分比
    expect(screen.getAllByText("交换").length).toBeGreaterThan(0);
    expect(screen.getAllByText("50%").length).toBeGreaterThan(0);
  });
});

describe("TrustBadge（COMP-012）", () => {
  it("等级含文字（非仅颜色）；onExplain 键盘可达", async () => {
    const onExplain = vi.fn();
    render(<TrustBadge level="high" onExplain={onExplain} />);
    expect(screen.getByText("高信任")).toBeInTheDocument();
    const btn = screen.getByRole("button", { name: "查看信任解释" });
    btn.focus();
    await userEvent.keyboard("{Enter}");
    expect(onExplain).toHaveBeenCalled();
  });
});

describe("ListRow（COMP-016）", () => {
  it("未读含可读「未读」文本 + 时间 <time> 绝对 title（非仅颜色）", () => {
    render(
      <ListRow
        title="交换请求"
        unread
        datetime="2026-06-22T09:00:00Z"
        relativeTime="1 小时前"
      />
    );
    expect(screen.getByText("未读")).toBeInTheDocument();
    const time = screen.getByText("1 小时前");
    expect(time.tagName.toLowerCase()).toBe("time");
    expect(time).toHaveAttribute("datetime", "2026-06-22T09:00:00Z");
  });
});
