#!/usr/bin/env node
/*
  know-share CLI —— 本机 Skill：扫描 → 脱敏 → 校验 → 上传。
  语义字段（标题/摘要/主题）由调用的 agent 给（flag 或交互）；机械部分本工具确定性完成。
  守则：只把脱敏清单交平台（INV-01）；上传只建 Draft，公开发布需主人站内确认（NFR-005）。
*/
import { readdir, readFile, writeFile, mkdir, stat } from "node:fs/promises";
import { join, relative, dirname, extname } from "node:path";
import { homedir } from "node:os";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import {
  scanFiles,
  redactText,
  buildManifest,
  validateManifest,
  uploadManifest,
  pickToken,
} from "./lib.mjs";
import { MANIFEST_SCHEMA } from "./schema.mjs";

const execFileP = promisify(execFile);
/** 本地凭据（know-share login 写入；token 解析链兜底读取）。 */
const CRED_PATH = join(homedir(), ".know-share", "credentials.json");

const TEXT_EXT = new Set([".md", ".markdown", ".txt", ".mdx", ".org", ".rst"]);

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith("--")) {
        args[key] = next;
        i++;
      } else {
        args[key] = true;
      }
    } else {
      args._.push(a);
    }
  }
  return args;
}

async function readTextFiles(dir) {
  const out = [];
  async function walk(d) {
    const entries = await readdir(d, { withFileTypes: true });
    for (const e of entries) {
      if (e.name.startsWith(".") || e.name === "node_modules") continue;
      const p = join(d, e.name);
      if (e.isDirectory()) await walk(p);
      else if (TEXT_EXT.has(extname(e.name).toLowerCase())) {
        out.push({ name: relative(dir, p), text: await readFile(p, "utf8") });
      }
    }
  }
  await walk(dir);
  return out;
}

function csv(v) {
  return typeof v === "string" ? v.split(",").map((s) => s.trim()).filter(Boolean) : undefined;
}

/** 读 `gh auth token`（装了 GitHub CLI 并登录 → 零配置取 token）。失败/未装 → null。 */
async function ghAuthToken() {
  try {
    const { stdout } = await execFileP("gh", ["auth", "token"], { timeout: 5000 });
    const t = stdout.trim();
    return t || null;
  } catch {
    return null;
  }
}

/** 读本地凭据文件（know-share login 写入）。 */
async function storedToken() {
  try {
    const j = JSON.parse(await readFile(CRED_PATH, "utf8"));
    return typeof j.token === "string" && j.token ? j.token : null;
  } catch {
    return null;
  }
}

/**
  token 解析链（让用户基本无感，不必手搓/裸存）：
  --token → KNOWSHARE_TOKEN/GITHUB_TOKEN → `gh auth token` → ~/.know-share 凭据。
*/
async function resolveToken(args) {
  return pickToken({
    explicit: typeof args.token === "string" ? args.token : undefined,
    env: process.env.KNOWSHARE_TOKEN || process.env.GITHUB_TOKEN || undefined,
    gh: await ghAuthToken(),
    stored: await storedToken(),
  });
}

/** know-share login —— GitHub OAuth Device Flow，授权后把 token 存到 ~/.know-share。 */
async function cmdLogin(args) {
  const clientId = (typeof args["client-id"] === "string" && args["client-id"]) || process.env.KNOW_SHARE_CLIENT_ID;
  if (!clientId)
    throw new Error(
      "缺少 --client-id（或 KNOW_SHARE_CLIENT_ID）：填平台 GitHub OAuth App 的 Client ID（需在 OAuth App 设置勾选 Enable Device Flow）"
    );
  const dc = await fetch("https://github.com/login/device/code", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({ client_id: clientId, scope: "read:user" }),
  }).then((r) => r.json());
  if (!dc.device_code) throw new Error("发起 device flow 失败：" + (dc.error_description || JSON.stringify(dc)));

  process.stdout.write(
    `\n请在浏览器打开：${dc.verification_uri}\n输入设备码：${dc.user_code}\n（授权后自动继续，等待中…）\n`
  );
  const interval = (dc.interval || 5) * 1000;
  const deadline = Date.now() + (dc.expires_in || 900) * 1000;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, interval));
    const tok = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: clientId,
        device_code: dc.device_code,
        grant_type: "urn:ietf:params:oauth:grant-type:device_code",
      }),
    }).then((r) => r.json());
    if (tok.access_token) {
      await mkdir(dirname(CRED_PATH), { recursive: true });
      await writeFile(
        CRED_PATH,
        JSON.stringify({ token: tok.access_token, savedAt: new Date().toISOString() }, null, 2),
        { mode: 0o600 }
      );
      process.stdout.write(`✓ 已登录并保存凭据 → ${CRED_PATH}\n之后 upload 无需 --token，自动读取。\n`);
      return;
    }
    if (tok.error && tok.error !== "authorization_pending" && tok.error !== "slow_down") {
      throw new Error("授权失败：" + (tok.error_description || tok.error));
    }
  }
  throw new Error("设备码已过期，请重试 know-share login");
}

async function cmdScan(args) {
  const input = args.input || args._[0];
  if (!input) throw new Error("用法：know-share scan --input <目录> [--title --summary --topics a,b --source-types notes --sensitivity low] [--out manifest.json]");
  const files = await readTextFiles(input);
  if (!files.length) throw new Error(`目录无文本文件：${input}`);
  const scan = scanFiles(files);

  const semantic = {
    title: args.title || "",
    summary: args.summary || "",
    topics: csv(args.topics) || [],
    source_types: csv(args["source-types"]) || ["notes"],
    sensitivity: args.sensitivity || "medium",
    redaction_notes: args["redaction-notes"] || "",
    version: args.version || "1.0.0",
    ...(csv(args.tags) ? { tags: csv(args.tags) } : {}),
    ...(args.language ? { language: args.language } : {}),
  };
  const manifest = buildManifest(semantic, scan);

  const report = {
    sourceStats: scan.sourceStats,
    privacyGate: scan.overall,
    findings: scan.findings,
    manifest,
    note:
      "title/summary/topics 等语义字段需由 agent 填写后再 validate/upload。" +
      (scan.overall === "block" ? " ⚠ 检出疑似密钥（block）：先 redact 再发布。" : ""),
  };
  const json = JSON.stringify(report, null, 2);
  if (args.out) {
    await writeFile(args.out, JSON.stringify(manifest, null, 2));
    process.stderr.write(`已写出 manifest 骨架 → ${args.out}\n`);
    process.stderr.write(`扫描：${scan.sourceStats.files} 文件 / ${scan.sourceStats.words} 词 · 隐私门 ${scan.overall} · findings ${scan.findings.length}\n`);
  } else {
    process.stdout.write(json + "\n");
  }
}

async function cmdRedact(args) {
  const input = args.input || args._[0];
  const out = args.out;
  if (!input || !out) throw new Error("用法：know-share redact --input <目录> --out <目录>");
  const files = await readTextFiles(input);
  let n = 0;
  for (const f of files) {
    const dest = join(out, f.name);
    await mkdir(dirname(dest), { recursive: true });
    await writeFile(dest, redactText(f.text));
    n++;
  }
  process.stderr.write(`已脱敏 ${n} 个文件 → ${out}（敏感片段替换为 [REDACTED:类别]）\n`);
}

async function loadSchema(api) {
  if (api) {
    try {
      const res = await fetch(`${api.replace(/\/$/, "")}/api/manifest-schema`);
      if (res.ok) return await res.json();
    } catch {
      /* 回退本地副本 */
    }
  }
  return MANIFEST_SCHEMA;
}

async function cmdValidate(args) {
  const file = args._[0] || args.file;
  if (!file) throw new Error("用法：know-share validate <manifest.json> [--api <平台地址>]");
  const manifest = JSON.parse(await readFile(file, "utf8"));
  const schema = await loadSchema(args.api);
  const { valid, errors } = validateManifest(manifest, schema);
  if (valid) {
    process.stdout.write("✓ Manifest 合规（符合 know-share-manifest@1）\n");
  } else {
    process.stderr.write("✗ Manifest 不合规：\n" + errors.map((e) => "  - " + e).join("\n") + "\n");
    process.exitCode = 1;
  }
}

async function cmdUpload(args) {
  const file = args._[0] || args.file;
  const apiBase = args.api || process.env.KNOWSHARE_API;
  const token = await resolveToken(args);
  if (!file) throw new Error("用法：know-share upload <manifest.json> --api <平台地址> [--token <token>]");
  if (!apiBase) throw new Error("缺少 --api（或环境变量 KNOWSHARE_API）");
  if (!token)
    throw new Error(
      "未取得 token。任选其一：--token <token>、环境变量 KNOWSHARE_TOKEN、`gh auth login`（自动用 gh auth token）、或先 `know-share login`。"
    );
  const manifest = JSON.parse(await readFile(file, "utf8"));

  // 上传前本地兜底校验。
  const { valid, errors } = validateManifest(manifest, await loadSchema(apiBase));
  if (!valid) {
    process.stderr.write("✗ 上传前校验失败：\n" + errors.map((e) => "  - " + e).join("\n") + "\n");
    process.exitCode = 1;
    return;
  }
  const { status, body } = await uploadManifest(manifest, { apiBase, token });
  if (status === 200) {
    process.stdout.write(
      `✓ 已上传，建 Draft 模块：module=${body.moduleId} submission=${body.submissionId} 隐私门=${body.privacyGate?.overall}\n` +
        "下一步：主人到站内 /me/drafts 走同意门提交审核 → 通过后公开（NFR-005）。\n"
    );
  } else {
    process.stderr.write(`✗ 上传失败 [${status}]：${body.error || ""} ${body.message || ""}\n`);
    process.exitCode = 1;
  }
}

const HELP = `know-share —— 本机知识模块发布工具（脱敏清单，不上传原文）

  know-share login    --client-id <OAuth App Client ID>   # 一次性浏览器授权，存凭据到 ~/.know-share
  know-share scan     --input <目录> [--title --summary --topics a,b --source-types notes --sensitivity low] [--out manifest.json]
  know-share redact   --input <目录> --out <目录>
  know-share validate <manifest.json> [--api <平台地址>]
  know-share upload   <manifest.json> --api <平台地址> [--token <token>]

token 解析顺序（upload）：--token → KNOWSHARE_TOKEN/GITHUB_TOKEN → \`gh auth token\` → ~/.know-share 凭据。
  · 装了 GitHub CLI 并 \`gh auth login\` → 直接可用，无需手动 token。
  · 否则 \`know-share login\` 走 OAuth Device Flow 一次，之后自动读取。

边界：平台只接收脱敏清单（不托管原文 INV-01）；上传只建 Draft，公开发布需主人站内确认（NFR-005）。
机读入口：<平台>/llms.txt、<平台>/api/openapi.json、<平台>/api/manifest-schema`;

async function main() {
  const argv = process.argv.slice(2);
  const cmd = argv[0];
  const args = parseArgs(argv.slice(1));
  try {
    switch (cmd) {
      case "login": await cmdLogin(args); break;
      case "scan": await cmdScan(args); break;
      case "redact": await cmdRedact(args); break;
      case "validate": await cmdValidate(args); break;
      case "upload": await cmdUpload(args); break;
      case "help": case "--help": case "-h": case undefined:
        process.stdout.write(HELP + "\n"); break;
      default:
        process.stderr.write(`未知命令：${cmd}\n\n${HELP}\n`);
        process.exitCode = 1;
    }
  } catch (e) {
    process.stderr.write(`错误：${e.message}\n`);
    process.exitCode = 1;
  }
}

main();
