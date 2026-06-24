#!/usr/bin/env node
/*
  know-share CLI —— 本机 Skill：扫描 → 脱敏 → 校验 → 上传。
  语义字段（标题/摘要/主题）由调用的 agent 给（flag 或交互）；机械部分本工具确定性完成。
  守则：只把脱敏清单交平台（INV-01）；上传只建 Draft，公开发布需主人站内确认（NFR-005）。
*/
import { readdir, readFile, writeFile, mkdir, stat } from "node:fs/promises";
import { join, relative, dirname, extname } from "node:path";
import {
  scanFiles,
  redactText,
  buildManifest,
  validateManifest,
  uploadManifest,
} from "./lib.mjs";
import { MANIFEST_SCHEMA } from "./schema.mjs";

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
  const token = args.token || process.env.KNOWSHARE_TOKEN || process.env.GITHUB_TOKEN;
  if (!file) throw new Error("用法：know-share upload <manifest.json> --api <平台地址> --token <GitHub 细粒度 token>");
  if (!apiBase) throw new Error("缺少 --api（或环境变量 KNOWSHARE_API）");
  if (!token) throw new Error("缺少 --token（或 KNOWSHARE_TOKEN / GITHUB_TOKEN）");
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

  know-share scan     --input <目录> [--title --summary --topics a,b --source-types notes --sensitivity low] [--out manifest.json]
  know-share redact   --input <目录> --out <目录>
  know-share validate <manifest.json> [--api <平台地址>]
  know-share upload   <manifest.json> --api <平台地址> --token <GitHub 细粒度 token>

边界：平台只接收脱敏清单（不托管原文 INV-01）；上传只建 Draft，公开发布需主人站内确认（NFR-005）。
机读入口：<平台>/llms.txt、<平台>/api/openapi.json、<平台>/api/manifest-schema`;

async function main() {
  const argv = process.argv.slice(2);
  const cmd = argv[0];
  const args = parseArgs(argv.slice(1));
  try {
    switch (cmd) {
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
