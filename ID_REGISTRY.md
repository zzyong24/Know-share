# ID Registry

## Purpose

Use stable IDs so downstream artifacts can trace to upstream intent and changes can invalidate affected work precisely.

## ID Prefixes

| Prefix | Meaning | Example |
| --- | --- | --- |
| `ASM` | Assumption | `ASM-001` |
| `DEC` | Decision | `DEC-001` |
| `FR` | Functional requirement | `FR-001` |
| `NFR` | Non-functional requirement | `NFR-001` |
| `FLOW` | Business or user flow | `FLOW-001` |
| `ENT` | Domain entity | `ENT-001` |
| `IA` | Information architecture surface | `IA-001` |
| `PAGE` | Page or screen contract | `PAGE-001` |
| `COMP` | Frontend component | `COMP-001` |
| `MOCK` | Mock data scenario | `MOCK-001` |
| `API` | Service contract operation | `API-001` |
| `TEST` | Test or validation scenario | `TEST-001` |
| `RISK` | Accepted or open risk | `RISK-001` |

## Registry

| ID | Type | Name | Defined In | Source IDs | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| `DEC-001` | Decision | Import prior Know-share project materials | `DECISION_LOG.md` | user request, prior workspace files | active | Current workspace was empty; prior project files were copied into this root. |
| `DEC-002` | Decision | Use product-to-code staged workflow | `DECISION_LOG.md` | user request | active | User explicitly invoked the product-to-code orchestrator for decomposition. |
| `ASM-001` | Assumption | Current root is canonical going forward | `DEFAULT_ASSUMPTIONS.md` | `DEC-001` | needs-confirmation | Future agents should operate in `/Users/zyongzhu/Workbase/Know-share`. |
| `ASM-002` | Assumption | Decomposition precedes implementation | `DEFAULT_ASSUMPTIONS.md` | user request | active | This turn creates planning artifacts; implementation starts only after specs and gates. |
| `ASM-003` | Assumption | Existing UI images are design inputs, not final contracts | `DEFAULT_ASSUMPTIONS.md` | `docs/design/*.png` | active | Page specs will normalize them into implementable requirements later. |

## Completion Standard

- Every requirement, flow, entity, page, API, and test referenced downstream has an ID here.
- IDs are stable after user confirmation; do not renumber because ordering changes.
- Deprecated IDs remain in the registry with status `deprecated` and a replacement when applicable.
