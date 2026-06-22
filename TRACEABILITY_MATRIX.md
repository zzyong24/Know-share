# Traceability Matrix

## Purpose

Show how product intent becomes flows, model concepts, pages, components, contracts, tests, validation evidence, and release decisions.

## Matrix

| Product ID | Flow IDs | Entity IDs | IA/Page IDs | Component IDs | Mock IDs | API IDs | Test IDs | Evidence | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `PENDING-FR` | `PENDING-FLOW` | `PENDING-ENT` | `PENDING-PAGE` | `PENDING-COMP` | `PENDING-MOCK` | `PENDING-API` | `PENDING-TEST` | `README.md`, `docs/mvp.md`, `docs/privacy-model.md`, `docs/data-contract.md`, `docs/design/*.png` | draft |

## Gap Review

| Gap ID | Description | Affected IDs | Severity | Required Action | Owner |
| --- | --- | --- | --- | --- | --- |
| `GAP-001` | Product capabilities from the UI images have not yet been assigned stable `FR`, `FLOW`, `ENT`, `PAGE`, `API`, or `TEST` IDs. | `PENDING-FR` | high | Produce `FUNCTION_OUTLINE.md`, then promote stable IDs through product, flow, domain, IA, page, and contract specs. | agent |
| `GAP-002` | Implementation cannot be parallelized safely until module boundaries and dependency order are explicit. | downstream implementation stages | high | Produce module/task decomposition after product and page specs are approved. | agent |

## Completion Standard

- Every confirmed `FR` and release-critical `NFR` has at least one validation path.
- Every page and API traces back to a product requirement or explicit decision.
- Every release-critical journey has test or browser-validation evidence.
- Any unimplemented confirmed requirement is listed as a gap, deferred work, or accepted risk.
