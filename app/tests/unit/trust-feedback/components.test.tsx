import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TrustScoreRing } from "@/components/trust-feedback/TrustScoreRing";
import { TrustExplanationLink } from "@/components/trust-feedback/TrustExplanationLink";
import { WeightDisclosureNote } from "@/components/trust-feedback/WeightDisclosureNote";
import { BadgeWall } from "@/components/trust-feedback/BadgeWall";
import { FeedbackQualityPanel } from "@/components/trust-feedback/FeedbackQualityPanel";
import { TrustBreakdown } from "@/components/trust-feedback/TrustBreakdown";
import {
  FeedbackForm,
  FEEDBACK_DIMENSIONS,
  detectSensitive,
} from "@/components/trust-feedback/FeedbackForm";
import type { TrustDimension } from "@/lib/queries/trust-feedback";

// recharts ResponsiveContainer 在 jsdom 下无尺寸；用最小 stub 避免噪声（仅图形容器）。
vi.mock("recharts", async (orig) => {
  const actual = await orig<typeof import("recharts")>();
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div style={{ width: 300, height: 240 }}>{children}</div>
    ),
  };
});

const DIMENSIONS: TrustDimension[] = [
  { key: "exchange", label: "交换历史", direction: "up", valueOrShare: "+340", explanation: "完成 18 次零争议交换。" },
  { key: "feedback", label: "反馈质量", direction: "up", valueOrShare: "+280", explanation: "参与方反馈均值高。" },
  { key: "github", label: "GitHub 验证", direction: "up", valueOrShare: "+160", explanation: "已验证。" },
  { key: "report", label: "举报记录（扣分）", direction: "down", valueOrShare: "−44", explanation: "中性扣分。" },
];

describe("COMP-110 TrustScoreRing", () => {
  it("渲染分值/满分/等级，并可触发解释（HARD-03 入口）", () => {
    const onExplain = vi.fn();
    render(
      <TrustScoreRing
        score={824}
        tierLabel="资深贡献者 / Trusted"
        textSummary="信任分 824，满分 1000，等级 资深贡献者"
        onExplain={onExplain}
      />
    );
    expect(screen.getByTestId("trust-score-value")).toHaveTextContent("824 / 1000");
    expect(screen.getByText("资深贡献者 / Trusted")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "查看信任分如何形成" }));
    expect(onExplain).toHaveBeenCalled();
  });

  it("解释缺失时显示「解释生成中」而非裸分入口（HARD-03 守卫）", () => {
    render(
      <TrustScoreRing
        score={824}
        tierLabel="资深贡献者"
        textSummary="summary"
        explanationAvailable={false}
      />
    );
    expect(screen.getByText(/解释生成中/)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "查看信任分如何形成" })
    ).not.toBeInTheDocument();
  });
});

describe("COMP-118 TrustExplanationLink（可解释性守卫）", () => {
  it("入口在场且点击触发 onOpen", () => {
    const onOpen = vi.fn();
    render(<TrustExplanationLink githubLogin="zyongzhu24" onOpen={onOpen} />);
    fireEvent.click(screen.getByTestId("trust-explanation-link"));
    expect(onOpen).toHaveBeenCalled();
  });
  it("explanationAvailable=false → 显示生成中占位，不渲染入口", () => {
    render(<TrustExplanationLink githubLogin="x" explanationAvailable={false} />);
    expect(screen.getByTestId("trust-explanation-pending")).toBeInTheDocument();
    expect(screen.queryByTestId("trust-explanation-link")).not.toBeInTheDocument();
  });
});

describe("COMP-119 WeightDisclosureNote（INV-10 不可移除）", () => {
  it("三种 context 各渲染对应固定权重文案", () => {
    const { rerender } = render(<WeightDisclosureNote context="profile" />);
    expect(screen.getByText(/来自实际交换参与方/)).toBeInTheDocument();
    rerender(<WeightDisclosureNote context="explanation" />);
    expect(screen.getByText(/对信任分的影响高于/)).toBeInTheDocument();
    rerender(<WeightDisclosureNote context="feedback-form" />);
    expect(screen.getByText(/你的反馈作为交换参与方/)).toBeInTheDocument();
  });
  it("无任何 prop 能隐藏文案（恒显）", () => {
    // 类型层面无 hidden/hide prop；渲染层恒显断言
    render(<WeightDisclosureNote context="explanation" rulesLink="/about" />);
    expect(screen.getByTestId("weight-disclosure")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "了解评分规则" })).toBeInTheDocument();
  });
});

describe("COMP-113 BadgeWall", () => {
  it("渲染徽章名称与授予条件 tooltip", () => {
    render(
      <BadgeWall
        badges={[
          { type: "top", name: "高贡献者", iconName: "auto_awesome", criteria: "完成 10 次零争议交换" },
        ]}
      />
    );
    expect(screen.getByText("高贡献者")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /授予条件：完成 10 次零争议交换/ })
    ).toBeInTheDocument();
  });
  it("空徽章 → EmptyState", () => {
    render(<BadgeWall badges={[]} />);
    expect(screen.getByText("尚未获得徽章")).toBeInTheDocument();
  });
});

describe("COMP-114 FeedbackQualityPanel（INV-10）", () => {
  it("含「来自实际交换参与方」权重标注，渲染五维均值", () => {
    render(
      <FeedbackQualityPanel
        dimensionAverages={[
          { key: "checklistConsistency", label: "清单一致性", score: 4.8, max: 5 },
          { key: "usefulness", label: "有用性", score: 4.7, max: 5 },
        ]}
        recentFeedback={[]}
      />
    );
    expect(screen.getByText(/来自实际交换参与方/)).toBeInTheDocument();
    expect(screen.getByText("清单一致性")).toBeInTheDocument();
    expect(screen.getByText("4.8 / 5")).toBeInTheDocument();
  });
  it("无反馈 → EmptyState（新用户态）", () => {
    render(<FeedbackQualityPanel dimensionAverages={[]} recentFeedback={[]} />);
    expect(screen.getByText("尚无交换反馈")).toBeInTheDocument();
  });
});

describe("COMP-111 TrustBreakdown（HARD-03 四类来源 + INV-10）", () => {
  it("展开四类来源 + 权重声明 + 评分规则链接", () => {
    render(
      <TrustBreakdown
        open
        dimensions={DIMENSIONS}
        totalScore={824}
        rulesLink="/about#trust-rules"
        onClose={() => {}}
      />
    );
    ["交换历史", "反馈质量", "GitHub 验证", "举报记录（扣分）"].forEach((label) =>
      expect(screen.getByText(label)).toBeInTheDocument()
    );
    expect(screen.getByTestId("weight-disclosure")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /评分规则/ }).length).toBeGreaterThan(0);
  });
  it("新用户态显示基础分说明而非裸拆解", () => {
    render(
      <TrustBreakdown open dimensions={[]} totalScore={0} rulesLink="/r" isNewUser onClose={() => {}} />
    );
    expect(screen.getByText(/信任分以基础分起步/)).toBeInTheDocument();
  });
});

describe("COMP-116 FeedbackForm（单一真源 / FLOW-004）", () => {
  it("五维必填校验：缺评分阻止提交并内联报错", () => {
    const onSubmit = vi.fn();
    render(
      <FeedbackForm
        exchangeContext={{ peerHandle: "rag-builder", moduleTitle: "RAG", statusLabel: "待反馈" }}
        onSubmit={onSubmit}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "提交反馈" }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText(/请为全部 5 个维度评分/)).toBeInTheDocument();
  });

  it("维度完整覆盖 ENT-010 五维，含权重提示（INV-10）", () => {
    render(
      <FeedbackForm
        exchangeContext={{ peerHandle: "x", moduleTitle: "m", statusLabel: "待反馈" }}
        onSubmit={() => {}}
      />
    );
    ["清单一致性", "隐私边界", "结构清晰度", "有用性", "再次交换意愿"].forEach((l) =>
      expect(screen.getByText(l)).toBeInTheDocument()
    );
    expect(screen.getByText(/你的反馈作为交换参与方/)).toBeInTheDocument();
    expect(FEEDBACK_DIMENSIONS).toHaveLength(5);
  });

  it("五维齐全后提交触发回调", () => {
    const onSubmit = vi.fn();
    render(
      <FeedbackForm
        exchangeContext={{ peerHandle: "x", moduleTitle: "m", statusLabel: "待反馈" }}
        allowPublicComment={false}
        onSubmit={onSubmit}
      />
    );
    FEEDBACK_DIMENSIONS.forEach((d) => {
      fireEvent.click(
        screen.getByRole("radio", { name: `${d.label} 评 5 分（满分 5）` })
      );
    });
    fireEvent.click(screen.getByRole("button", { name: "提交反馈" }));
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        scores: expect.objectContaining({ checklistConsistency: 5, rebuyIntent: 5 }),
      })
    );
  });

  it("submitted 态只读不可提交（唯一性 NFR-006）", () => {
    render(
      <FeedbackForm
        exchangeContext={{ peerHandle: "x", moduleTitle: "m", statusLabel: "已完成" }}
        submissionState="submitted"
        onSubmit={() => {}}
      />
    );
    expect(screen.getByText("已提交")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "提交反馈" })).not.toBeInTheDocument();
  });

  it("window-closed 态显示反馈窗口已结束（ASM-011）", () => {
    render(
      <FeedbackForm
        exchangeContext={{ peerHandle: "x", moduleTitle: "m", statusLabel: "已关闭" }}
        submissionState="window-closed"
        onSubmit={() => {}}
      />
    );
    expect(screen.getByText("窗口已结束")).toBeInTheDocument();
  });

  it("公开评论敏感信息检测（疑似邮箱/密钥/私有路径，INV-04）", () => {
    expect(detectSensitive("联系我 a@b.com")).toContain("疑似邮箱");
    expect(detectSensitive("token=ABCDEFGH12345")).toContain("疑似密钥/令牌");
    expect(detectSensitive("见 /Users/me/.env")).toContain("疑似私有路径");
    expect(detectSensitive("结构清晰，很有帮助")).toHaveLength(0);
  });
});
