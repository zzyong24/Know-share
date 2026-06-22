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
| `FR-001` | Functional requirement | Public site shell and navigation | `FUNCTION_OUTLINE.md` | `README.md`, `docs/design/*.png` | draft | Includes global nav, GitHub login surface, search entry, and submit entry. |
| `FR-010` | Functional requirement | Discovery registry module cards | `FUNCTION_OUTLINE.md` | `docs/mvp.md`, discovery UI | draft | Search/filter/sort and public card metadata. |
| `FR-020` | Functional requirement | Knowledge module detail | `FUNCTION_OUTLINE.md` | module detail UI | draft | Manifest preview, source stats, privacy boundary, request action. |
| `FR-030` | Functional requirement | Manifest submission and privacy gate | `FUNCTION_OUTLINE.md` | submit module UI, privacy model | draft | Wizard, scan findings, redaction suggestions, preview. |
| `FR-040` | Functional requirement | Exchange request and public records | `FUNCTION_OUTLINE.md` | exchange records UI | draft | Request lifecycle, public record, private handoff tracking. |
| `FR-050` | Functional requirement | Structured feedback and trust | `FUNCTION_OUTLINE.md` | trust profile UI, exchange records UI | draft | Feedback dimensions, trust level, badges. |
| `FR-060` | Functional requirement | User trust profile | `FUNCTION_OUTLINE.md` | trust profile UI | draft | GitHub identity, reputation metrics, modules, exchange history. |
| `FR-070` | Functional requirement | Social signals and community actions | `FUNCTION_OUTLINE.md` | discovery/detail/exchange UI | draft | Favorites, recognitions, basic comments/reports. |
| `FR-080` | Functional requirement | Agent Skill and MCP tooling surface | `FUNCTION_OUTLINE.md` | agent skills UI | draft | Skill catalog, commands, install/docs, supported sources. |
| `FR-090` | Functional requirement | Privacy, safety, and consent controls | `FUNCTION_OUTLINE.md` | privacy model, submit UI | draft | Consent points, scan rules, content commitment, takedown path. |
| `FR-100` | Functional requirement | Admin and moderation | `FUNCTION_OUTLINE.md` | UI overview admin panel | draft | Review queue, risk summary, actions, audit trail. |
| `FR-110` | Functional requirement | Open API and agent-readable registry | `FUNCTION_OUTLINE.md` | README, data contract | draft | Public read APIs and later authenticated submission/feedback contracts. |
| `FR-120` | Functional requirement | Notifications | `FUNCTION_OUTLINE.md` | exchange workflow inference | draft | In-app notifications first; email/webhooks deferred. |
| `NFR-001` | Non-functional requirement | Privacy-first data minimization | `FUNCTION_OUTLINE.md` | privacy model | draft | Public platform must not store raw private knowledge content. |
| `NFR-002` | Non-functional requirement | Agent-readable by design | `FUNCTION_OUTLINE.md` | README, data contract | draft | Structured manifests and later APIs. |
| `NFR-003` | Non-functional requirement | Traceable implementation | `FUNCTION_OUTLINE.md` | product-to-code workflow | draft | All work must trace to approved IDs. |
| `NFR-004` | Non-functional requirement | Open-source auditability | `FUNCTION_OUTLINE.md` | README | draft | Rules and trust explanations inspectable. |
| `NFR-005` | Non-functional requirement | Human consent gates | `FUNCTION_OUTLINE.md` | privacy model | draft | Consent before generation, submission, contact, exchange. |
| `NFR-006` | Non-functional requirement | Abuse resistance | `FUNCTION_OUTLINE.md` | trust/moderation UI | draft | Identity checks, rate limits, audit trails. |
| `NFR-007` | Non-functional requirement | Accessible public website | `FUNCTION_OUTLINE.md` | public site requirement | draft | Must be verified in frontend validation stage. |
| `PKG-001` | Work package | Registry discovery vertical | `FUNCTION_OUTLINE.md` | `FR-001`, `FR-010` | draft | Parallel candidate after page specs. |
| `PKG-002` | Work package | Module detail vertical | `FUNCTION_OUTLINE.md` | `FR-020`, `FR-090` | draft | Parallel candidate after page specs and mock data. |
| `PKG-003` | Work package | Submission and privacy gate vertical | `FUNCTION_OUTLINE.md` | `FR-030`, `FR-090` | draft | High-risk; wait for privacy and contracts. |
| `PKG-004` | Work package | Exchange lifecycle vertical | `FUNCTION_OUTLINE.md` | `FR-040`, `FR-050` | draft | Needs state machine. |
| `PKG-005` | Work package | Trust and feedback vertical | `FUNCTION_OUTLINE.md` | `FR-050`, `FR-060` | draft | Mock early, real scoring later. |
| `PKG-006` | Work package | Agent skills docs/tooling vertical | `FUNCTION_OUTLINE.md` | `FR-080`, `FR-110` | draft | CLI/MCP can be separate from website. |
| `PKG-007` | Work package | Admin moderation vertical | `FUNCTION_OUTLINE.md` | `FR-100` | draft | Follows submission pipeline. |
| `PKG-008` | Work package | Public API vertical | `FUNCTION_OUTLINE.md` | `FR-110` | draft | Contract-first. |

## Completion Standard

- Every requirement, flow, entity, page, API, and test referenced downstream has an ID here.
- IDs are stable after user confirmation; do not renumber because ordering changes.
- Deprecated IDs remain in the registry with status `deprecated` and a replacement when applicable.
