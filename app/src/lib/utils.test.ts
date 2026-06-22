import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

// Task Zero 冒烟测试：证明测试运行器工作 + cn 合并行为正确。
describe("cn", () => {
  it("merges class names", () => {
    expect(cn("a", "b")).toBe("a b");
  });
  it("dedupes conflicting tailwind classes (last wins)", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });
  it("drops falsy values", () => {
    expect(cn("a", false, undefined, "b")).toBe("a b");
  });
});
