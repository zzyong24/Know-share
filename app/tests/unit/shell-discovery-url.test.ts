import { describe, it, expect } from "vitest";
import {
  parseDiscoveryParams,
  parseSearchScope,
} from "@/components/shell-discovery/url";
import { buildDiscoveryQuery } from "@/lib/queries/discovery";

/*
  发现页 URL ↔ 状态解析（PAGE-002 Validation：非法值忽略/回退默认）。
*/
describe("parseDiscoveryParams", () => {
  it("解析合法筛选/排序/查询", () => {
    const sp = new URLSearchParams(
      "type=Published&topic=Agent&trustLevel=high&verifiedOnly=true&sort=popular&q=rag"
    );
    const r = parseDiscoveryParams(sp);
    expect(r.filters).toEqual({
      type: ["Published"],
      topic: ["Agent"],
      trustLevel: ["high"],
      verifiedOnly: true,
    });
    expect(r.sort).toBe("popular");
    expect(r.q).toBe("rag");
  });

  it("非法 type/trustLevel/sort 被忽略并回退默认", () => {
    const sp = new URLSearchParams("type=Bogus&trustLevel=ultra&sort=bogus");
    const r = parseDiscoveryParams(sp);
    expect(r.filters.type).toBeUndefined();
    expect(r.filters.trustLevel).toBeUndefined();
    expect(r.sort).toBe("relevance");
  });

  it("q 截断到 200 字符", () => {
    const sp = new URLSearchParams(`q=${"x".repeat(300)}`);
    expect(parseDiscoveryParams(sp).q).toHaveLength(200);
  });
});

describe("parseSearchScope", () => {
  it("合法 scope 原样返回", () => {
    expect(parseSearchScope("modules")).toBe("modules");
  });
  it("非法/缺失 scope 回退 all", () => {
    expect(parseSearchScope("bogus")).toBe("all");
    expect(parseSearchScope(null)).toBe("all");
  });
});

describe("buildDiscoveryQuery", () => {
  it("FilterValue + sort + q → 规范化 query string", () => {
    const sp = buildDiscoveryQuery({
      filters: { type: ["Published"], topic: ["Agent", "RAG"], verifiedOnly: true },
      sort: "trust",
      q: "记忆",
    });
    expect(sp.getAll("topic")).toEqual(["Agent", "RAG"]);
    expect(sp.get("type")).toBe("Published");
    expect(sp.get("verifiedOnly")).toBe("true");
    expect(sp.get("sort")).toBe("trust");
    expect(sp.get("q")).toBe("记忆");
  });
  it("relevance 排序不写入（默认）", () => {
    const sp = buildDiscoveryQuery({ sort: "relevance" });
    expect(sp.has("sort")).toBe(false);
  });
});
