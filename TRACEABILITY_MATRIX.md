# Traceability Matrix

## Purpose

Show how product intent becomes flows, model concepts, pages, components, contracts, tests, validation evidence, and release decisions.

## Matrix

| Product ID | Flow IDs | Entity IDs | IA/Page IDs | Component IDs | Mock IDs | API IDs | Test IDs | Evidence | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `FR-001` | `PENDING-FLOW` | `PENDING-ENT` | `PENDING-PAGE` | `PENDING-COMP` | `PENDING-MOCK` | `PENDING-API` | `PENDING-TEST` | `FUNCTION_OUTLINE.md`, `docs/design/*.png` | draft |
| `FR-010` | `PENDING-FLOW` | `PENDING-ENT` | `PENDING-PAGE` | `PENDING-COMP` | `PENDING-MOCK` | `PENDING-API` | `PENDING-TEST` | `FUNCTION_OUTLINE.md`, discovery UI | draft |
| `FR-020` | `PENDING-FLOW` | `PENDING-ENT` | `PENDING-PAGE` | `PENDING-COMP` | `PENDING-MOCK` | `PENDING-API` | `PENDING-TEST` | `FUNCTION_OUTLINE.md`, module detail UI | draft |
| `FR-030` | `PENDING-FLOW` | `PENDING-ENT` | `PENDING-PAGE` | `PENDING-COMP` | `PENDING-MOCK` | `PENDING-API` | `PENDING-TEST` | `FUNCTION_OUTLINE.md`, submit module UI | draft |
| `FR-040` | `PENDING-FLOW` | `PENDING-ENT` | `PENDING-PAGE` | `PENDING-COMP` | `PENDING-MOCK` | `PENDING-API` | `PENDING-TEST` | `FUNCTION_OUTLINE.md`, exchange records UI | draft |
| `FR-050` | `PENDING-FLOW` | `PENDING-ENT` | `PENDING-PAGE` | `PENDING-COMP` | `PENDING-MOCK` | `PENDING-API` | `PENDING-TEST` | `FUNCTION_OUTLINE.md`, trust profile UI | draft |
| `FR-060` | `PENDING-FLOW` | `PENDING-ENT` | `PENDING-PAGE` | `PENDING-COMP` | `PENDING-MOCK` | `PENDING-API` | `PENDING-TEST` | `FUNCTION_OUTLINE.md`, trust profile UI | draft |
| `FR-070` | `PENDING-FLOW` | `PENDING-ENT` | `PENDING-PAGE` | `PENDING-COMP` | `PENDING-MOCK` | `PENDING-API` | `PENDING-TEST` | `FUNCTION_OUTLINE.md`, discovery/detail UI | draft |
| `FR-080` | `PENDING-FLOW` | `PENDING-ENT` | `PENDING-PAGE` | `PENDING-COMP` | `PENDING-MOCK` | `PENDING-API` | `PENDING-TEST` | `FUNCTION_OUTLINE.md`, agent skills UI | draft |
| `FR-090` | `PENDING-FLOW` | `PENDING-ENT` | `PENDING-PAGE` | `PENDING-COMP` | `PENDING-MOCK` | `PENDING-API` | `PENDING-TEST` | `FUNCTION_OUTLINE.md`, `docs/privacy-model.md` | draft |
| `FR-100` | `PENDING-FLOW` | `PENDING-ENT` | `PENDING-PAGE` | `PENDING-COMP` | `PENDING-MOCK` | `PENDING-API` | `PENDING-TEST` | `FUNCTION_OUTLINE.md`, UI overview admin panel | draft |
| `FR-110` | `PENDING-FLOW` | `PENDING-ENT` | `PENDING-PAGE` | `PENDING-COMP` | `PENDING-MOCK` | `PENDING-API` | `PENDING-TEST` | `FUNCTION_OUTLINE.md`, `docs/data-contract.md` | draft |
| `FR-120` | `PENDING-FLOW` | `PENDING-ENT` | `PENDING-PAGE` | `PENDING-COMP` | `PENDING-MOCK` | `PENDING-API` | `PENDING-TEST` | `FUNCTION_OUTLINE.md` | draft |

## Gap Review

| Gap ID | Description | Affected IDs | Severity | Required Action | Owner |
| --- | --- | --- | --- | --- | --- |
| `GAP-001` | Product capabilities now have initial `FR` IDs, but do not yet have flow, entity, page, component, mock, API, or test IDs. | `FR-001` through `FR-120` | high | Promote stable IDs through product, flow, domain, IA, page, and contract specs. | agent |
| `GAP-002` | Implementation cannot be parallelized safely until module boundaries and dependency order are explicit. | downstream implementation stages | high | Produce module/task decomposition after product and page specs are approved. | agent |

## Completion Standard

- Every confirmed `FR` and release-critical `NFR` has at least one validation path.
- Every page and API traces back to a product requirement or explicit decision.
- Every release-critical journey has test or browser-validation evidence.
- Any unimplemented confirmed requirement is listed as a gap, deferred work, or accepted risk.
