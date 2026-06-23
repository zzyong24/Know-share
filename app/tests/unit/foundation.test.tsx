import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { resolveIcon, ICON_MAP } from "@/lib/icon-map";
import { stripSensitiveFields } from "@/lib/api";
import { PrimaryButton } from "@/components/shared/primary-button";

describe("icon-map（DEC-012 单一图标族）", () => {
  it("已映射图标名返回对应组件", () => {
    expect(resolveIcon("search")).toBe(ICON_MAP.search);
  });
  it("未映射图标名兜底为 Info 并告警", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const c = resolveIcon("不存在的图标");
    expect(c).toBe(ICON_MAP.info);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});

describe("白名单守卫（INV-04）", () => {
  it("剥离禁止公开字段并告警", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const out = stripSensitiveFields({
      id: "m1",
      title: "公开",
      contact: "x@example.com",
      rawContent: "secret",
    });
    expect(out).not.toHaveProperty("contact");
    expect(out).not.toHaveProperty("rawContent");
    expect(out).toHaveProperty("title", "公开");
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
  it("无敏感字段时原样返回", () => {
    const o = { id: "m1", title: "公开" };
    expect(stripSensitiveFields(o)).toBe(o);
  });
});

describe("PrimaryButton（COMP-007）", () => {
  it("loading 时 aria-busy 且吞掉点击防重复提交", async () => {
    const onClick = vi.fn();
    render(
      <PrimaryButton loading onClick={onClick}>
        提交
      </PrimaryButton>
    );
    const btn = screen.getByRole("button");
    expect(btn).toHaveAttribute("aria-busy", "true");
    await userEvent.click(btn);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("正常态点击触发 onClick", async () => {
    const onClick = vi.fn();
    render(<PrimaryButton onClick={onClick}>提交</PrimaryButton>);
    await userEvent.click(screen.getByRole("button", { name: "提交" }));
    expect(onClick).toHaveBeenCalled();
  });
});
