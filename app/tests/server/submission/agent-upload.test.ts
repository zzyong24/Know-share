/*
  Agent 原生上传（POST /api/submissions）契约 + 不变量。
  Agent 持 GitHub 细粒度 token 上传脱敏 Manifest → 建 Draft 模块（不公开、不入审核）。
  守则：
  - 认证：Bearer token 解析为行动者（无/无效 → 401）。
  - 契约：manifestUploadSchema strict —— 多余键（如 contact）/原始内容 → 400（INV-01/03 边界）。
  - 缺必填字段 → 400。
  - 隐私门服务端复核：block → 409 不落库（INV-02）。
  - 成功：建 knowledge_module(Draft)+manifest+submission(Draft,moduleId)+privacy_scan，写 audit；
    停在 Draft（NFR-005：agent 只准备草稿，公开发布要人确认）。
*/
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupHarness, schema, type Harness } from "../_harness";
import { eq } from "drizzle-orm";
import { setTokenVerifier } from "@/server/api-auth";
import { POST as uploadRoute } from "@/app/api/submissions/route";

let h: Harness;

const TOKEN = "ghp_test_token";
const PROFILE = { id: 4242, login: "agent-owner", name: "Agent Owner", avatar_url: "https://a.example/o.png" };

const validManifest = {
  title: "Agent 记忆系统设计要点",
  summary: "围绕长期记忆与检索的脱敏要点清单。",
  topics: ["agent", "memory"],
  source_types: ["notes", "papers"],
  source_stats: { notes: 12, links: 3 },
  sensitivity: "low",
  redaction_notes: "已移除全部原文摘录与本地路径。",
  version: "1.0.0",
};

function uploadReq(body: unknown, withToken = true): Request {
  return new Request("http://localhost/api/submissions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(withToken ? { authorization: `Bearer ${TOKEN}` } : {}),
    },
    body: JSON.stringify(body),
  });
}

beforeEach(async () => {
  h = await setupHarness({ seed: false });
  // 注入 token 校验器：仅认 TOKEN（避免真实 GitHub 网络）。
  setTokenVerifier(async (t) => (t === TOKEN ? PROFILE : null));
});

afterEach(async () => {
  setTokenVerifier(null);
  await h.teardown();
});

describe("POST /api/submissions —— Agent 上传脱敏 Manifest", () => {
  it("有效 token + 合法 manifest → 200，建 Draft 模块+manifest+提交+扫描，写 audit", async () => {
    const res = await uploadRoute(uploadReq({ manifest: validManifest }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      submissionId: string;
      moduleId: string;
      status: string;
      privacyGate: { overall: string };
    };
    expect(body.status).toBe("Draft");
    expect(body.privacyGate.overall).toBe("pass");

    const [mod] = await h.db
      .select()
      .from(schema.knowledgeModules)
      .where(eq(schema.knowledgeModules.id, body.moduleId));
    expect(mod.status).toBe("Draft");
    expect(mod.title).toBe(validManifest.title);

    const [man] = await h.db
      .select()
      .from(schema.manifests)
      .where(eq(schema.manifests.moduleId, body.moduleId));
    expect(man.sourceTypes).toEqual(validManifest.source_types);

    const [sub] = await h.db
      .select()
      .from(schema.submissions)
      .where(eq(schema.submissions.id, body.submissionId));
    expect(sub.status).toBe("Draft");
    expect(sub.moduleId).toBe(body.moduleId);

    const scans = await h.db
      .select()
      .from(schema.privacyScans)
      .where(eq(schema.privacyScans.submissionId, body.submissionId));
    expect(scans).toHaveLength(1);

    const audit = await h.db
      .select()
      .from(schema.auditLog)
      .where(eq(schema.auditLog.targetId, body.submissionId));
    expect(audit.some((a) => a.action === "submission.agent-upload")).toBe(true);
  });

  it("无 token → 401", async () => {
    const res = await uploadRoute(uploadReq({ manifest: validManifest }, false));
    expect(res.status).toBe(401);
  });

  it("无效 token → 401", async () => {
    const req = new Request("http://localhost/api/submissions", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: "Bearer wrong" },
      body: JSON.stringify({ manifest: validManifest }),
    });
    expect((await uploadRoute(req)).status).toBe(401);
  });

  it("含禁止字段 contact → 400（守 INV-01/03 边界），不落库", async () => {
    const res = await uploadRoute(
      uploadReq({ manifest: { ...validManifest, contact: { type: "email", value: "a@b.com" } } })
    );
    expect(res.status).toBe(400);
    const mods = await h.db.select().from(schema.knowledgeModules);
    expect(mods).toHaveLength(0);
  });

  it("缺必填字段（无 summary）→ 400", async () => {
    const { summary, ...noSummary } = validManifest;
    void summary;
    const res = await uploadRoute(uploadReq({ manifest: noSummary }));
    expect(res.status).toBe(400);
  });

  it("隐私门 block（summary 含疑似密钥）→ 409，不落库（INV-02）", async () => {
    const res = await uploadRoute(
      uploadReq({ manifest: { ...validManifest, summary: "包含 api_key 片段的摘要" } })
    );
    expect(res.status).toBe(409);
    const mods = await h.db.select().from(schema.knowledgeModules);
    expect(mods).toHaveLength(0);
  });
});
