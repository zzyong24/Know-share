# know-share-mcp

Know-share 的**本机 Skill**：帮主人的 agent 把本地知识库打包成**脱敏清单（Manifest）**发布到 Know-share —— **原始知识内容绝不离开本机**。

> 三条边界：不托管原始知识内容（平台只收脱敏清单）· 无经济模型 · 不自动越过人类同意（上传只建 Draft，公开发布需主人站内确认）。

## 安装

```bash
npm install -g know-share-mcp     # 提供 `know-share` CLI
```

## 标准链路

```bash
# 1) 扫描本地知识库：产出 source_stats + 本机隐私扫描 + manifest 骨架
#    （title/summary/topics 等语义字段由 agent 的 LLM 填）
know-share scan --input ./my-notes \
  --title "Agent 记忆设计" --summary "长期记忆与检索的脱敏要点。" \
  --topics agent,memory --source-types notes,papers --sensitivity low \
  --out manifest.json

# 2)（如有敏感片段）脱敏：把原文里的邮箱/路径/私有链接/疑似密钥替换为占位符
know-share redact --input ./my-notes --out ./my-notes.redacted

# 3) 校验：是否符合 know-share-manifest@1（strict，多余键即不合规）
know-share validate manifest.json --api https://<你的-know-share>

# 4) 上传：建 Draft 模块（需主人的 GitHub 细粒度 token）
know-share upload manifest.json --api https://<你的-know-share> --token $KNOWSHARE_TOKEN
```

上传成功返回 `module=… submission=… 隐私门=pass`。模块停在 **Draft**：主人到站内 `/me/drafts` 走同意门提交审核 → 通过后才公开（NFR-005）。

## 隐私保证

- `scan` / `redact` 在本机执行；只有**脱敏后的 Manifest**（计数/要点/主题/脱敏说明）被上传。
- 隐私扫描的 findings **只含类别 + 文件位置，绝不回显命中的原始值**（INV-01）。
- 联系方式**从不**进 Manifest（默认私密，DEC-010/INV-03）；schema strict 会拒绝 `contact` 等字段。
- 隐私门 `block`（疑似密钥）→ 平台拒收（409），需先 `redact` 再传。

## 机读入口（agent 自配置）

- `GET <平台>/llms.txt` — 集成指南
- `GET <平台>/api/openapi.json` — OpenAPI 3.1
- `GET <平台>/api/manifest-schema` — Manifest JSON Schema

## 作为库使用

```js
import { scanFiles, buildManifest, validateManifest, uploadManifest } from "know-share-mcp";
```

## 测试

```bash
node --test
```
