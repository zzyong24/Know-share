import "./_polyfill";
import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  ConsentRecordList,
  MySectionList,
  NotificationItem,
  DashboardOverview,
} from "@/components/account";
import type { ConsentRecord } from "@/lib/queries/account";

/*
  account 集群组件单测（COMP-150/152/154/157）。纯组件层，props 注入，无网络。
*/

describe("ConsentRecordList（COMP-157）", () => {
  const records: ConsentRecord[] = [
    {
      id: "cd-1",
      counterpartyHandle: "knowledge-trader",
      disclosedMethods: ["GitHub", "邮箱"],
      date: "2024-10-12",
      exchangeRef: "EX-2024-8842",
      source: "因交换自动授权",
      revocable: true,
    },
  ];

  it("撤回弹确认且文案含「只影响未来」「无法收回」（ASM-013）", async () => {
    const user = userEvent.setup();
    const onRevoke = vi.fn();
    render(<ConsentRecordList records={records} onRevoke={onRevoke} />);
    // 撤回按钮键盘可聚焦（非仅 hover）
    const btn = screen.getByRole("button", {
      name: "撤回对 @knowledge-trader 的披露",
    });
    await user.click(btn);
    const dialog = await screen.findByRole("alertdialog");
    expect(dialog).toHaveTextContent("撤回只影响未来披露");
    expect(dialog).toHaveTextContent("无法收回");
    await user.click(within(dialog).getByRole("button", { name: "确认撤回" }));
    expect(onRevoke).toHaveBeenCalledWith("cd-1");
  });

  it("空记录渲染披露空态文案", () => {
    render(<ConsentRecordList records={[]} mode="disclosure" />);
    expect(screen.getByText("暂无披露记录")).toBeInTheDocument();
    expect(
      screen.getByText(/联系方式仅在交换被接受后才会披露/)
    ).toBeInTheDocument();
  });
});

describe("MySectionList（COMP-152）", () => {
  it("drafts 空分区渲染空态 + 去提交向导 CTA", () => {
    render(<MySectionList section="drafts" items={[]} />);
    expect(screen.getByText("还没有草稿")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "去提交向导创建" })
    ).toHaveAttribute("href", "/submit");
  });

  it("received 交换行渲染 StatusPill 文字（状态非仅颜色）", () => {
    render(
      <MySectionList
        section="received"
        items={[
          {
            id: "EX-2024-9001",
            targetModuleId: "m-x",
            targetModuleTitle: "测试模块",
            requesterLogin: "bot-dev",
            providerLogin: "zyongzhu24",
            status: "Requested",
            createdAt: "2026-06-22",
            updatedAt: "2026-06-22",
          },
        ]}
      />
    );
    expect(screen.getByText("已请求")).toBeInTheDocument();
    expect(screen.getByText(/来自 @bot-dev/)).toBeInTheDocument();
  });
});

describe("NotificationItem（COMP-154）", () => {
  it("未读：渲染圆点 + sr-only「未读」+ 加粗按钮", () => {
    render(
      <ul>
        <NotificationItem
          id="n-1"
          type="exchange"
          read={false}
          title="交换请求已接受"
          createdAt="2026-06-22T09:00:00Z"
        />
      </ul>
    );
    expect(screen.getByText("未读：")).toBeInTheDocument();
  });

  it("已读本体点击仅触发 onOpen，不触发 onMarkRead", async () => {
    const user = userEvent.setup();
    const onOpen = vi.fn();
    const onMarkRead = vi.fn();
    render(
      <ul>
        <NotificationItem
          id="n-3"
          type="feedback"
          read
          title="收到新反馈"
          createdAt="2026-06-20T08:15:00Z"
          refLink={{ href: "/x" }}
          onOpen={onOpen}
          onMarkRead={onMarkRead}
        />
      </ul>
    );
    await user.click(screen.getByText("收到新反馈"));
    expect(onOpen).toHaveBeenCalled();
    expect(onMarkRead).not.toHaveBeenCalled();
  });

  it("引用失效时显示「该内容已不可用」且不可点", () => {
    render(
      <ul>
        <NotificationItem
          id="n-9"
          type="community"
          read
          title="某社区事件"
          createdAt="2026-06-19T11:00:00Z"
          refLink={{ href: "#", disabled: true }}
        />
      </ul>
    );
    expect(screen.getByText("该内容已不可用")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "查看" })
    ).not.toBeInTheDocument();
  });
});

describe("DashboardOverview（COMP-150）", () => {
  const base = {
    currentUser: {
      displayName: "钟",
      githubHandle: "zyongzhu24",
      githubVerified: true,
    },
    welcomeSummary: "今天有 2 个待处理的交换请求",
  };

  it("未读>0 显示红点 + 数字 aria 标签", () => {
    render(
      <DashboardOverview
        {...base}
        stats={{
          myModulesCount: 6,
          activeExchangesCount: 3,
          trustScore: 824,
          unreadNotificationsCount: 5,
        }}
      />
    );
    expect(screen.getByText("未读通知（5 条）")).toBeInTheDocument();
  });

  it("未读=0 不显示条数后缀（去红点语义）", () => {
    render(
      <DashboardOverview
        {...base}
        stats={{
          myModulesCount: 6,
          activeExchangesCount: 3,
          trustScore: 824,
          unreadNotificationsCount: 0,
        }}
      />
    );
    expect(screen.getByText("未读通知")).toBeInTheDocument();
    expect(screen.queryByText(/未读通知（/)).not.toBeInTheDocument();
  });
});
