# aies/ — 产物目录地图

本目录集中存放 product-to-code-orchestrator 工作流的全部产物，按**交付阶段分层**，在设计/前端/后端层内**按功能模块扇出**子目录，方便浏览与多 agent 并行。

```text
aies/
├─ 00-control/        控制与追溯（每阶段都会更新）
│   ├─ ARTIFACT_MANIFEST.yaml    阶段状态与产物清单（唯一状态源）
│   ├─ ID_REGISTRY.md            所有稳定 ID 登记
│   ├─ DECISION_LOG.md           决策与用户确认记录
│   ├─ TRACEABILITY_MATRIX.md    需求→流程→实体→页面→API→测试 的追溯
│   ├─ CHANGE_IMPACT.md          已批准变更对下游的影响
│   └─ DEFAULT_ASSUMPTIONS.md    默认假设记录
├─ 01-product/        产品与领域
│   ├─ FUNCTION_OUTLINE.md       能力大纲（已产出）
│   ├─ PRODUCT_SPEC.md           产品规格（阶段 03，唯一可信来源）
│   ├─ BUSINESS_FLOW.md          业务流程
│   └─ LIGHT_DOMAIN_MODEL.md     轻量领域模型
├─ 02-design/         设计
│   ├─ IA_SPEC.md                信息架构
│   ├─ UI_RULES.md               UI 源规范化规则
│   └─ <模块>/                   PAGE_SPEC · COMPONENTS_SPEC · MOCK_DATA_SPEC
├─ 03-frontend/       前端
│   ├─ FRONTEND_SPEC.md          前端计划
│   └─ <模块>/                   实现说明 · FRONTEND_VALIDATION_REPORT
├─ 04-backend/        后端
│   └─ <模块>/                   BACKEND_SPEC · MODULE_WORKFLOW_SPEC · SERVICE_CONTRACT · TEST_PLAN
└─ 05-release/        发布
    ├─ INTEGRATION_REPORT.md     集成证据
    └─ RELEASE_REVIEW.md         发布就绪评审
```

## 约定

- **入口文件留在仓库根**：`AGENTS.md`、`PROJECT_CONTEXT.md`、`README.md`。
- **源材料留在仓库根**：`docs/`（产品/隐私/数据/设计图）、`examples/`。
- **实现代码落在仓库根**（不进 `aies/`）：如 `app/`、`server/`、`tests/`，具体目录名由已批准的前后端规格决定。
- **模块扇出**：当某模块在 02/03/04 层产生具体规格时，在该层下新建 `<模块名>/` 子目录存放。
- **状态唯一源**：阶段状态只以 `00-control/ARTIFACT_MANIFEST.yaml` 为准；`orchestrator/process/reconcile.mjs` 会校验目录与状态一致性（`control_root` 已指向 `aies/00-control`）。

> 当前进度：阶段 03（产品规格）。02–05 层为预留骨架，随阶段推进逐步填充。
