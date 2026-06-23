import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatBlock } from "@/components/shared/stat-block";

/*
  COMP-014 StatBlock 测试：value+label 关联；趋势含箭头+文字（非仅颜色）；empty 占位；loading 骨架。
*/
describe("StatBlock（COMP-014）", () => {
  it("渲染 value 与 label", () => {
    render(<StatBlock value="12,857" label="交换总数" />);
    expect(screen.getByText("12,857")).toBeInTheDocument();
    expect(screen.getByText("交换总数")).toBeInTheDocument();
  });

  it("趋势含方向文字（非仅颜色 NFR-007）", () => {
    render(
      <StatBlock
        value={100}
        label="模块"
        trend={{ direction: "up", delta: "12%" }}
      />
    );
    expect(
      screen.getByLabelText(/较上期上升 12%/)
    ).toBeInTheDocument();
  });

  it("空值渲染占位 —", () => {
    render(<StatBlock value="" label="无数据" />);
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("loading 不渲染数值", () => {
    render(<StatBlock value="999" label="加载中" loading />);
    expect(screen.queryByText("999")).not.toBeInTheDocument();
  });
});
