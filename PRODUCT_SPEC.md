# Product Spec

## Artifact Metadata

- Stage: `03-product-spec`
- Status: `needs-user-confirmation`
- Source inputs: `README.md`, `docs/mvp.md`, `docs/privacy-model.md`, `docs/data-contract.md`, `examples/knowledge-module.manifest.json`, `docs/design/*.png`, `FUNCTION_OUTLINE.md`
- Decision IDs: `DEC-002`, `DEC-003`, `DEC-004`, `DEC-005`
- Manifest status: `03-product-spec` draft pending user confirmation

## Problem Statement

Personal knowledge bases contain valuable patterns, research, project experience, and decision traces, but most of that value is locked inside private vaults. People cannot easily discover whose knowledge modules may be useful, and agents cannot safely compare exchange value without exposing private notes.

Know-share solves this by making sanitized knowledge-module manifests discoverable. The public platform shows enough structured metadata, trust evidence, privacy boundaries, and exchange outcomes for agents and humans to judge whether an exchange is worthwhile. It must not become a raw note hosting platform. Private knowledge remains local or inside explicitly approved private exchange channels.

## Target Users And Jobs

| User | Job |
| --- | --- |
| Publishing agent | Help its owner generate, redact, validate, and submit a privacy-safe module manifest. |
| Consuming agent | Search public manifests, evaluate match value, and recommend whether its owner should request exchange. |
| Human owner | Stay in control of what gets scanned, published, contacted, exchanged, and reviewed. |
| Exchange participant | Request, accept, complete, verify, and review a private knowledge exchange. |
| Contributor / community member | Build and inspect trust through modules, feedback, public exchange records, and profile reputation. |
| Moderator / operator | Review manifests, privacy findings, reports, rate-limit issues, and trust/abuse signals. |

## Core User Scenarios

### Scenario 1: Discover A Useful Module

A user or agent opens the discovery registry, searches by topic or keyword, filters by module type/trust/language/freshness, reviews module cards, and opens a module detail page. The platform reveals sanitized summaries, covered questions, source statistics, trust signals, privacy boundary, manifest preview, and exchange entry without exposing raw notes.

### Scenario 2: Publish A Privacy-Safe Manifest

A publishing agent scans an owner-approved knowledge scope locally, creates or imports a manifest, runs a privacy gate, shows warnings/blockers, suggests redactions, lets the owner review the public card, and submits for platform review. The owner must be able to stop before any public submission.

### Scenario 3: Request And Complete Exchange

An interested participant requests exchange for a target module and offers an owned module or acceptable exchange intent. Both sides approve before any private exchange. The public platform tracks relationship, status, verification summary, and feedback while keeping private repo content and private URLs hidden.

### Scenario 4: Build Trust Through Feedback

After a completed exchange, both participants submit structured feedback about manifest consistency, privacy boundary, structure clarity, usefulness, and willingness to exchange again. The trust system updates module/user signals and explains how trust is formed.

### Scenario 5: Operate The Registry Safely

Moderators review submitted manifests, privacy scan results, reports, risk levels, submitter signals, and rate-limit flags. They can approve, reject, request changes, take down modules, and audit moderation history.

### Scenario 6: Agent-Readable Integration

Agents consume public registry data through structured manifests and later public APIs. Authenticated operations such as submission and feedback use explicit contracts and must never return private content.

## Functional Requirements

| ID | Requirement | Acceptance Notes |
| --- | --- | --- |
| `FR-001` | Public site shell and navigation | The product exposes discovery, exchange records, trust network, Agent skills, repo/help surfaces, global search, GitHub identity state, and submit entry. Public browsing does not require login unless an action needs identity. |
| `FR-010` | Discovery registry | Users can search, filter, sort, browse module cards, view popular topics and platform stats, save/favorite modules, and request exchange from public module cards. |
| `FR-020` | Knowledge module detail | Detail pages show module identity, sanitized summary, covered questions, source statistics, manifest preview/full view, privacy boundary, content commitment, feedback highlights, request exchange, and report action. |
| `FR-030` | Manifest submission and privacy gate | Submission supports module type choice, manifest generation/import, privacy scanning, warning/blocking findings, redaction suggestions, manifest download/save, public card preview, draft save, review submission, and private exchange package preparation. |
| `FR-040` | Exchange request and public records | The product supports exchange requests, offered modules, acceptance/rejection, lifecycle states, private handoff tracking, public exchange records, verification summaries, feedback summaries, and pending-feedback reminders. |
| `FR-050` | Feedback and trust system | Participants can submit structured post-exchange feedback. The product computes and displays trust levels, score components, feedback quality dimensions, badges, and trust explanation. Verified participant feedback carries more weight than casual social signals. |
| `FR-060` | User trust profile | Public profiles show GitHub identity, verification marker, profile summary, domain tags, join/recent activity, trust level, score trend, published modules, exchange history, feedback quality, recognition, and badges. |
| `FR-070` | Social signals and community actions | Signed-in users can favorite, recognize, comment or provide low-weight feedback snippets, and report content. Social actions are unique where appropriate, auditable, rate-limited, and lower weight than verified exchange feedback. |
| `FR-080` | Agent Skill / MCP tooling surface | The product presents local-first tools for Create Manifest, Redact Knowledge, Validate Manifest, Package Private Repo, and Submit Feedback, including install/docs affordances, MCP configuration, command examples, privacy level, local execution state, and supported knowledge sources. |
| `FR-090` | Privacy, safety, and consent controls | The platform stores manifests and public relationships, not raw notes or private repo contents. It enforces consent points, scans sensitive data, requires sensitivity/redaction declarations, shows content commitment, supports reporting, and enables takedown. |
| `FR-100` | Admin and moderation | Moderators can review queues by pending/flagged/report/rate-limit/audit states, inspect risk summaries and submitter signals, approve/publish, reject, request changes, handle reports, and track admin actions. |
| `FR-110` | Open API and agent-readable registry | Agents can read public modules, users, exchange records, and search data through structured APIs. Authenticated submission and feedback operations follow approved contracts and never expose private content. |
| `FR-120` | Notifications | Users receive in-app notifications for exchange requests, accept/reject decisions, review decisions, feedback due, received feedback, comments, and recognitions. Email/webhooks may be added later by decision. |

## Non-Functional Requirements

| ID | Requirement | Criteria |
| --- | --- | --- |
| `NFR-001` | Privacy-first data minimization | No public or release-critical path requires uploading raw notes, full excerpts, private paths, credentials, private embeddings, or unsanitized third-party personal data. |
| `NFR-002` | Agent-readable by design | Manifest and API outputs are structured, documented, and safe for agents to consume without scraping UI. |
| `NFR-003` | Traceable implementation | Every page, component, API, mock, and test must trace to approved FR/NFR, flow, entity, or decision IDs. |
| `NFR-004` | Open-source auditability | Privacy rules, schema definitions, trust explanation, moderation concepts, and workflow decisions are inspectable in project artifacts. |
| `NFR-005` | Human consent gates | Owner consent is required before scanning a scope, public submission, contact request, private exchange, and public feedback attribution. |
| `NFR-006` | Abuse resistance | Identity checks, uniqueness constraints, rate limits, report handling, moderation audit trail, and trust weighting prevent obvious gaming and unsafe publication. |
| `NFR-007` | Accessible public website | Public and authenticated screens must be keyboard-navigable, readable, responsive, and validated in frontend validation stage. |

## Out Of Scope

- Public hosting of raw knowledge bases, raw notes, full documents, private embeddings, or private repository contents.
- Silent automatic exchange without both owners approving the private exchange.
- Treating UI images as final implementation contracts without page specs.
- Letting casual likes/comments override verified exchange feedback.
- Platform-managed GitHub private repository automation before security, permission, and service contracts are approved.
- Building implementation code before product spec, flow, domain model, IA, page spec, frontend spec, mock data, and bootstrap gates are satisfied.

## Assumptions

| ID | Assumption | Risk / Revisit Trigger |
| --- | --- | --- |
| `ASM-001` | `/Users/zyongzhu/Workbase/Know-share` is the canonical project root. | Revisit if the user wants the old workspace path to remain canonical. |
| `ASM-002` | Current work is decomposition/specification before implementation. | Revisit if user asks to scaffold code before required specs. |
| `ASM-003` | UI images are design inputs, not final page contracts. | Revisit during UI import and page spec stages. |
| `ASM-004` | The product remains privacy-first and agent-first. | Revisit if the product becomes a general social marketplace or raw content host. |
| `ASM-005` | Multi-agent implementation starts after stable module boundaries exist. | Revisit during module workflow and service contract stages. |
| `ASM-006` | Design covers the complete target product; implementation sequencing is separate. | Revisit only if user requests release-specific scope. |

## Acceptance Criteria

| Criteria ID | Linked IDs | Criteria |
| --- | --- | --- |
| `AC-001` | `FR-010`, `FR-020`, `NFR-001` | A user can discover and inspect a module using public metadata without seeing raw notes or private paths. |
| `AC-002` | `FR-030`, `FR-090`, `NFR-005` | A publishing flow requires local review and explicit owner consent before public submission. |
| `AC-003` | `FR-040`, `NFR-001`, `NFR-005` | Exchange records can show relationship, status, verification, and feedback without exposing private repo content. |
| `AC-004` | `FR-050`, `FR-060`, `NFR-006` | Trust profile and module trust signals are derived from structured feedback, verification, and auditable events. |
| `AC-005` | `FR-080`, `FR-110`, `NFR-002` | Agent-facing tools and APIs use structured inputs/outputs and preserve local-first privacy boundaries. |
| `AC-006` | `FR-100`, `FR-090`, `NFR-006` | Moderation can block or request changes for risky manifests before publication. |
| `AC-007` | `NFR-003` | Downstream artifacts link every implemented behavior to approved product IDs and validation evidence. |

## Success Signals

- Agents can compare knowledge modules using structured public manifests.
- Users can publish useful manifests without exposing raw notes.
- Exchange participants can complete private exchanges while the public platform shows only safe relationship/outcome data.
- Trust signals help users identify reliable contributors and modules.
- Moderation and privacy gates reduce unsafe manifest publication.
- Future implementation agents can continue from artifacts rather than chat history.
