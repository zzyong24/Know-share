# 可追溯矩阵

## 目的

展示产品意图如何转化为流程、模型概念、页面、组件、契约、测试、验证证据以及发布决策。

## 矩阵

| Product ID | Flow IDs | Entity IDs | IA/Page IDs | Component IDs | Mock IDs | API IDs | Test IDs | 证据 | 状态 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `FR-001` | `PENDING-FLOW` | `PENDING-ENT` | `PENDING-PAGE` | `PENDING-COMP` | `PENDING-MOCK` | `PENDING-API` | `PENDING-TEST` | `FUNCTION_OUTLINE.md`、`docs/design/*.png` | draft |
| `FR-010` | `PENDING-FLOW` | `PENDING-ENT` | `PENDING-PAGE` | `PENDING-COMP` | `PENDING-MOCK` | `PENDING-API` | `PENDING-TEST` | `FUNCTION_OUTLINE.md`、发现 UI | draft |
| `FR-020` | `PENDING-FLOW` | `PENDING-ENT` | `PENDING-PAGE` | `PENDING-COMP` | `PENDING-MOCK` | `PENDING-API` | `PENDING-TEST` | `FUNCTION_OUTLINE.md`、模块详情 UI | draft |
| `FR-030` | `PENDING-FLOW` | `PENDING-ENT` | `PENDING-PAGE` | `PENDING-COMP` | `PENDING-MOCK` | `PENDING-API` | `PENDING-TEST` | `FUNCTION_OUTLINE.md`、提交模块 UI | draft |
| `FR-040` | `PENDING-FLOW` | `PENDING-ENT` | `PENDING-PAGE` | `PENDING-COMP` | `PENDING-MOCK` | `PENDING-API` | `PENDING-TEST` | `FUNCTION_OUTLINE.md`、交换记录 UI | draft |
| `FR-050` | `PENDING-FLOW` | `PENDING-ENT` | `PENDING-PAGE` | `PENDING-COMP` | `PENDING-MOCK` | `PENDING-API` | `PENDING-TEST` | `FUNCTION_OUTLINE.md`、信任档案 UI | draft |
| `FR-060` | `PENDING-FLOW` | `PENDING-ENT` | `PENDING-PAGE` | `PENDING-COMP` | `PENDING-MOCK` | `PENDING-API` | `PENDING-TEST` | `FUNCTION_OUTLINE.md`、信任档案 UI | draft |
| `FR-070` | `PENDING-FLOW` | `PENDING-ENT` | `PENDING-PAGE` | `PENDING-COMP` | `PENDING-MOCK` | `PENDING-API` | `PENDING-TEST` | `FUNCTION_OUTLINE.md`、发现/详情 UI | draft |
| `FR-080` | `PENDING-FLOW` | `PENDING-ENT` | `PENDING-PAGE` | `PENDING-COMP` | `PENDING-MOCK` | `PENDING-API` | `PENDING-TEST` | `FUNCTION_OUTLINE.md`、agent 技能 UI | draft |
| `FR-090` | `PENDING-FLOW` | `PENDING-ENT` | `PENDING-PAGE` | `PENDING-COMP` | `PENDING-MOCK` | `PENDING-API` | `PENDING-TEST` | `FUNCTION_OUTLINE.md`、`docs/privacy-model.md` | draft |
| `FR-100` | `PENDING-FLOW` | `PENDING-ENT` | `PENDING-PAGE` | `PENDING-COMP` | `PENDING-MOCK` | `PENDING-API` | `PENDING-TEST` | `FUNCTION_OUTLINE.md`、UI 概览管理面板 | draft |
| `FR-110` | `PENDING-FLOW` | `PENDING-ENT` | `PENDING-PAGE` | `PENDING-COMP` | `PENDING-MOCK` | `PENDING-API` | `PENDING-TEST` | `FUNCTION_OUTLINE.md`、`docs/data-contract.md` | draft |
| `FR-120` | `PENDING-FLOW` | `PENDING-ENT` | `PENDING-PAGE` | `PENDING-COMP` | `PENDING-MOCK` | `PENDING-API` | `PENDING-TEST` | `FUNCTION_OUTLINE.md` | draft |

## 缺口评审

| Gap ID | 描述 | 受影响 IDs | 严重程度 | 所需行动 | 负责人 |
| --- | --- | --- | --- | --- | --- |
| `GAP-001` | 产品能力现已具备初始的 `FR` ID，但尚未拥有流程、实体、页面、组件、mock、API 或测试 ID。 | `FR-001` 至 `FR-120` | high | 通过产品、流程、领域、IA、页面和契约规格逐步确立稳定 ID。 | agent |
| `GAP-002` | 在模块边界与依赖顺序明确之前，无法安全地并行化实现。 | 下游实现阶段 | high | 在产品和页面规格获批后产出模块/任务分解。 | agent |

## 完成标准

- 每一个已确认的 `FR` 和发布关键的 `NFR` 都至少有一条验证路径。
- 每个页面和 API 都能回溯到某项产品需求或明确决策。
- 每条发布关键的旅程都有测试或浏览器验证证据。
- 任何尚未实现的已确认需求都被列为缺口、延后工作或已接受风险。
