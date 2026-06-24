/*
  Agent 机读入口契约：/api/openapi.json + /api/manifest-schema。
  保证 agent 进站即可拿到能力清单、认证方式、Manifest 规范与三条边界。
*/
import { describe, it, expect } from "vitest";
import { GET as openapiRoute } from "@/app/api/openapi.json/route";
import { GET as schemaRoute } from "@/app/api/manifest-schema/route";

describe("GET /api/openapi.json —— 机读 API 描述", () => {
  it("3.1 文档含上传端点 + bearerAuth + manifest schema + 三条边界", async () => {
    const res = await openapiRoute(new Request("https://know-share.app/api/openapi.json"));
    expect(res.status).toBe(200);
    const doc = (await res.json()) as Record<string, unknown>;

    expect(doc.openapi).toBe("3.1.0");
    const paths = doc.paths as Record<string, Record<string, unknown>>;
    expect(paths["/api/submissions"]?.post).toBeTruthy();

    const comps = doc.components as Record<string, Record<string, unknown>>;
    expect(comps.securitySchemes?.bearerAuth).toBeTruthy();
    expect(comps.schemas?.Manifest).toBeTruthy();

    const info = doc.info as Record<string, unknown>;
    expect(Array.isArray(info["x-boundaries"])).toBe(true);
    expect((info["x-boundaries"] as string[]).length).toBe(3);
    // 上传端点指向 manifest 契约 + 标注 401/409 不变量
    const submit = paths["/api/submissions"].post as Record<string, Record<string, unknown>>;
    expect(submit.security).toBeTruthy();
    expect(submit.responses["409"]).toBeTruthy();
  });
});

describe("GET /api/manifest-schema —— Manifest 上传契约", () => {
  it("strict（additionalProperties:false）+ 必填字段齐 + 不含 contact 属性（守 INV-01/03）", async () => {
    const res = await schemaRoute();
    expect(res.status).toBe(200);
    const schema = (await res.json()) as {
      additionalProperties: boolean;
      required: string[];
      properties: Record<string, unknown>;
    };
    expect(schema.additionalProperties).toBe(false);
    for (const f of ["title", "summary", "topics", "source_types", "sensitivity", "redaction_notes", "version"]) {
      expect(schema.required).toContain(f);
    }
    // 契约里没有 contact 字段：随 additionalProperties:false 即拒绝（边界）。
    expect(schema.properties.contact).toBeUndefined();
  });
});
