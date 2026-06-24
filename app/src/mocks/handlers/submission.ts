/*
  提交向导 MSW handlers（PAGE-020~024）。导出 submissionHandlers；不改聚合器（src/mocks/handlers.ts）。
  说明：隐私扫描在「本机」执行（ASM-028），这里以 MOCK 端点模拟技能产出的脱敏 findings；
  平台只接收 / 返回脱敏后的 findings 与脱敏 Manifest，不接收命中的原始私有值（INV-01）。
*/
import { http, HttpResponse, type RequestHandler } from "msw";
import {
  newDraft,
  restoredDraft,
  submissionSkills,
  scanPass,
  scanWarn,
  scanBlock,
} from "../fixtures/submission";
import type {
  ManifestDraft,
  PrivacyScanResult,
  SubmitResult,
} from "@/lib/queries/submission";

/**
 * 依脱敏 Manifest 内容选择三态扫描结果（确定性，便于测试驱动 block 不可绕过 / warn 勾选门）。
 * 仅检查脱敏摘要里是否含触发关键字（非真实扫描；真实扫描在本机技能内）。
 */
function pickScanResult(manifest: ManifestDraft | undefined): PrivacyScanResult {
  if (!manifest) return scanPass;
  const blob = `${manifest.summary ?? ""} ${manifest.redaction_notes ?? ""}`.toLowerCase();
  if (blob.includes("secret") || blob.includes("token") || blob.includes("密钥")) {
    return scanBlock;
  }
  if (manifest.contact?.value) return scanWarn;
  return scanPass;
}

export const submissionHandlers: RequestHandler[] = [
  // 新建草稿（PAGE-020 empty）
  http.get("/api/submissions/draft", () => HttpResponse.json(newDraft)),

  // 恢复草稿（PAGE-020 restored-draft，深链 /submit/{id}/...）
  http.get("/api/submissions/:id", ({ params }) => {
    if (params.id === restoredDraft.id) return HttpResponse.json(restoredDraft);
    return HttpResponse.json({ ...newDraft, id: String(params.id) });
  }),

  // 删除草稿（个人中心；仅本人、仅 Draft —— mock 直接成功）
  http.delete("/api/submissions/:id", ({ params }) =>
    HttpResponse.json({ id: String(params.id), deleted: true })
  ),

  // 从模块发起编辑：建 moduleId 指向原模块的 Draft 草稿（返回草稿外壳）
  http.post("/api/modules/:id/edit-draft", ({ params }) =>
    HttpResponse.json({ ...newDraft, id: `draft-of-${params.id}` })
  ),

  // 本机可用 Agent 技能 / MCP（ENT-016；COMP-073）
  http.get("/api/submissions/skills", () =>
    HttpResponse.json({ items: submissionSkills })
  ),

  // 隐私扫描（POST 脱敏 Manifest → 脱敏 findings；INV-01）
  http.post("/api/submissions/privacy-scan", async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as {
      manifest?: ManifestDraft;
    };
    return HttpResponse.json(pickScanResult(body.manifest));
  }),

  // 提交（写 Consent + AuditLog；Draft→Submitted；INV-08/INV-11/NFR-006）
  http.post("/api/submissions/:id/submit", async ({ params, request }) => {
    const body = (await request.json().catch(() => ({}))) as {
      consent?: { actionType?: string };
    };
    // 防御：未携带提交同意 → 422（前端已硬禁用，这里二次校验 INV-08/NFR-005）
    if (!body.consent || body.consent.actionType !== "submit") {
      return HttpResponse.json(
        { error: "缺少公开提交同意。" },
        { status: 422 }
      );
    }
    const result: SubmitResult = {
      id: String(params.id),
      status: "InReview",
      privacyOverall: "pass",
      submittedAt: "2026-06-23T03:00:00Z",
    };
    return HttpResponse.json(result);
  }),
];
