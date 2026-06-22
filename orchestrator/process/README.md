# process/ — 可执行流程层（skill 模板）

将本目录复制到某个项目中，作为 `orchestrator/process/`。它让各项控制产物变得可被机器校验，
而非仅靠自我声明。参见 `rules/orchestrator-state-machine.md` 中的 §"Executable
Enforcement" 以及 `gates/_GATE_EVIDENCE.md`。

- `reconcile.mjs` — 漂移检测器 / 可执行质量门。校验清单（manifest），在工作分支上核对构建声明与
  git+文件系统的实际状态，强制执行阻塞一致性，并标记相对于决策日志的陈旧情况。运行
  `node orchestrator/process/reconcile.mjs`（退出码 0 表示干净 / 1 表示漂移 / 2 表示缺失）。
  零依赖（Node ≥18）。将其接入为一项必需的 CI 检查。
- `manifest.schema.json` — ARTIFACT_MANIFEST.yaml 的结构 + 枚举契约。
- `reconcile.config.json` — 按项目配置：`work_branch` + `probes`（stage→在该阶段超出 not-started 后
  必须存在的 path）。示例：
  `{ "work_branch": "feat/x", "probes": [ { "stage": "16-backend-tdd", "path": "backend/src" } ] }`

行业类比：terraform 漂移、GitOps reconcile、CI 必需检查、policy-as-code、DO-178C
双向可追溯、ADR 不可变历史。
