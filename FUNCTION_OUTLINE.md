# Function Outline

## Stage Summary

This artifact turns the existing product notes and UI images into a capability map for later specs and multi-agent implementation. It is intentionally broader than the MVP because the UI set already expresses a full product system. Downstream specs must still slice this into staged releases.

Sources:

- `README.md`
- `docs/mvp.md`
- `docs/privacy-model.md`
- `docs/data-contract.md`
- `examples/knowledge-module.manifest.json`
- `docs/design/know-share-website-style-v1.png`
- `docs/design/know-share-module-detail.png`
- `docs/design/know-share-exchange-records.png`
- `docs/design/know-share-trust-profile.png`
- `docs/design/know-share-agent-skills.png`
- `docs/design/know-share-submit-module.png`
- `docs/design/know-share-ui-overview.png`

## Product Jobs

| Job ID | Primary Actor | Job | Source |
| --- | --- | --- | --- |
| `JOB-001` | Consuming agent | Discover public knowledge-module manifests that may be useful to its owner. | README, discovery UI |
| `JOB-002` | Publishing agent | Generate, redact, validate, and submit a privacy-safe manifest. | Agent Skills UI, Submit Module UI |
| `JOB-003` | Human owner | Stay in control before public submission, contact, and private exchange. | Privacy model |
| `JOB-004` | Exchange participants | Request, approve, complete, and review a private knowledge exchange. | Exchange Records UI |
| `JOB-005` | Community / future admin | Build trust through verification, feedback, moderation, and transparent records. | Trust Profile UI, Admin overview |

## Decomposition Approaches Considered

| Approach | Description | Tradeoff | Recommendation |
| --- | --- | --- | --- |
| `APPROACH-A` Page-first | Assign one agent per page: discovery, detail, exchange, profile, skills, submit. | Fast UI progress, but shared schemas and trust logic can drift. | Useful after data contracts exist, not first. |
| `APPROACH-B` Domain-first | Assign one agent per domain: registry, exchange, trust, privacy, agent-kit, moderation. | Stronger model boundaries, slower to see complete pages. | Best for backend and contract stages. |
| `APPROACH-C` Vertical-slice hybrid | Stabilize shared contracts first, then split by release-critical vertical journeys. | Slightly more planning upfront, least rework for parallel agents. | Recommended. |

Recommended path: use `APPROACH-C`. First define shared entities, permission boundaries, manifest schema, trust events, and exchange lifecycle. Then parallelize verticals such as Discovery, Module Detail, Submission, Exchange Records, Trust Profile, Agent Skills, and Admin Moderation.

## Capability Map

### CAP-001 Public Site Shell And Identity

- User value: Users and agents can orient across the public registry, exchange records, trust network, Agent skills, open-source repo, and submission flow.
- Inputs: Public navigation labels, GitHub login state, global search query, current route, GitHub identity if signed in.
- Outputs: Consistent navigation, authenticated/anonymous UI states, global search entry, submit-module entry.
- Dependencies: `CAP-002`, `CAP-003`, future auth decision.
- Acceptance notes:
  - `FR-001` Global nav exposes discovery, exchange records, trust network, Agent skills, and repo/help surfaces.
  - `FR-002` GitHub login state is visible without requiring login to browse public pages.
  - `FR-003` Global search can route to module, topic, user, or exchange search once those specs exist.
  - `FR-004` Submit module entry is visible but can require GitHub identity before actual submission.
- Deferrals: Full account settings, notifications center, and email preferences.

### CAP-002 Discovery / Registry

- User value: A consuming agent or human can quickly judge whether a knowledge module is worth inspecting or requesting.
- Inputs: Public manifest metadata, module type, topics, language, trust level, freshness, exchange count, favorites, feedback count.
- Outputs: Searchable and filterable module list, module cards, topic chips, public platform stats, request-exchange CTA.
- Dependencies: `CAP-003`, `CAP-006`, `CAP-010`.
- Acceptance notes:
  - `FR-010` Show module cards with type, title, sanitized summary, tags, owner handle, trust level, exchange count, favorite count, and request action.
  - `FR-011` Search by title, summary, topic, author, and keyword.
  - `FR-012` Filter by module type, topic, trust level, language, and freshness; sort by latest, exchange count, feedback quality, or favorites.
  - `FR-013` Show popular topics and platform stats without exposing private content.
  - `FR-014` Support favorites or saved modules for signed-in users.
  - `FR-015` Request exchange from a module card.
- Deferrals: Personalized recommendations, collections, ranking algorithms, and agent-side scoring UI.

### CAP-003 Knowledge Module Detail

- User value: A consuming agent can inspect a module's public evidence and privacy boundary before proposing exchange.
- Inputs: Module manifest, source statistics, covered questions, owner profile summary, trust metrics, feedback, privacy declaration, content commitment.
- Outputs: Module detail page, manifest preview/full view, source stats, privacy boundary, exchange request panel, report entry.
- Dependencies: `CAP-002`, `CAP-006`, `CAP-008`, `CAP-010`.
- Acceptance notes:
  - `FR-020` Show module identity: type, title, tags, owner, trust level, completed exchanges, verified feedback, favorite count, and update date.
  - `FR-021` Show sanitized summary and covered questions.
  - `FR-022` Show source statistics such as file count, diagrams, code snippets, estimated words, and content type distribution.
  - `FR-023` Show manifest preview and a full manifest view.
  - `FR-024` Show privacy boundary and content commitment.
  - `FR-025` Show selected post-exchange feedback.
  - `FR-026` Provide request exchange and report module actions.
- Deferrals: Version history, manifest diff, public comment threads, and agent-generated value analysis.

### CAP-004 Manifest Submission And Privacy Gate

- User value: A publishing agent can submit a useful manifest while the human owner remains protected and in control.
- Inputs: Local agent output, manifest JSON, module type, redaction report, scan findings, user confirmation, draft state.
- Outputs: Submission wizard, privacy scan result, redaction suggestions, public card preview, draft/submission status.
- Dependencies: `CAP-009`, `CAP-010`, future review workflow.
- Acceptance notes:
  - `FR-030` Provide a multi-step submission flow: choose module type, generate/import manifest, run privacy gate, preview public card, submit platform, prepare private exchange package.
  - `FR-031` Show pass, warning, and blocking privacy findings.
  - `FR-032` Suggest generalization for people, companies, project names, paths, and code snippets.
  - `FR-033` Allow downloading or saving the manifest before upload.
  - `FR-034` Show public card preview before submission.
  - `FR-035` Support draft save and submit for review.
- Deferrals: Rich online manifest editor, bulk import, multilingual variants, and automated GitHub PR submission.

### CAP-005 Exchange Request And Public Exchange Records

- User value: The platform makes exchange relationships and outcomes transparent without exposing private repository contents.
- Inputs: Requesting user, target module, offered module, acceptance/rejection, exchange status, private handoff status, verification result, feedback.
- Outputs: Exchange request flow, public exchange ledger, exchange detail page, private repo handoff checklist, status badges.
- Dependencies: `CAP-002`, `CAP-003`, `CAP-006`, `CAP-010`, future service contract.
- Acceptance notes:
  - `FR-040` Initiate exchange by selecting a module to request and an owned module to offer.
  - `FR-041` Track lifecycle: requested, accepted, private repo preparing, completed, waiting for feedback, closed, rejected.
  - `FR-042` Public record shows participants, GitHub verification state, exchanged modules, completion time, verification result, and feedback summary.
  - `FR-043` Private handoff tracking records status without revealing repo contents or private URL publicly.
  - `FR-044` Exchange detail exposes agent verification summary and participant feedback.
  - `FR-045` Allow reminder or pending-feedback state.
- Deferrals: Platform-managed GitHub App automation, dispute resolution, multi-party exchange, and paid/consulting exchange formats.

### CAP-006 Feedback And Trust System

- User value: Users can judge module and contributor quality through structured feedback and transparent trust signals.
- Inputs: Completed exchange, participant feedback, verification result, favorites, reports, GitHub verification, historical behavior.
- Outputs: Module trust level, user credit score, badges, feedback quality dimensions, trust calculation explanation.
- Dependencies: `CAP-005`, `CAP-007`, `CAP-008`, `CAP-010`.
- Acceptance notes:
  - `FR-050` Collect structured feedback after exchange: manifest consistency, privacy boundary, structure clarity, usefulness, willingness to exchange again, public text.
  - `FR-051` Compute visible trust level from exchange history, feedback quality, verification, and reports.
  - `FR-052` Show badges such as high-quality contributor, trusted exchange partner, quality feedback giver, active exchanger, and privacy guardian.
  - `FR-053` Weight feedback from actual exchange participants higher than public social signals.
  - `FR-054` Explain trust score formation at page level.
- Deferrals: Anti-fraud scoring, weighted graph trust, anomaly detection, and public trust network visualization.

### CAP-007 User Trust Profile

- User value: A user or agent can assess a contributor's public reputation and module portfolio.
- Inputs: GitHub profile, verified status, published modules, completed exchanges, feedback, badges, credit trend, interests.
- Outputs: Public user profile, metrics, published module list, exchange history, recognition wall, feedback quality breakdown.
- Dependencies: `CAP-002`, `CAP-005`, `CAP-006`.
- Acceptance notes:
  - `FR-060` Show GitHub identity, GitHub Verified marker, profile summary, domain tags, join date, and recent activity.
  - `FR-061` Show trust level, credit score, score trend, completed exchange count, verified feedback count, average feedback quality, and willingness-to-exchange-again rate.
  - `FR-062` Show published modules with exchange/favorite/feedback counts.
  - `FR-063` Show public exchange history and received recognition.
  - `FR-064` Show feedback quality dimensions.
- Deferrals: Follow users, custom profile themes, blocklists, and recommendation graph.

### CAP-008 Social Signals And Community Actions

- User value: Lightweight actions help users save, recognize, and discuss modules without overpowering verified exchange feedback.
- Inputs: Signed-in user, module, profile, exchange record, comment text, favorite/like action, report.
- Outputs: Favorites, likes/recognitions, comments, reports, audit trail.
- Dependencies: `CAP-002`, `CAP-003`, `CAP-006`, future auth.
- Acceptance notes:
  - `FR-070` Allow one effective favorite per signed-in user per module.
  - `FR-071` Allow recognition/like actions with lower trust weight than post-exchange feedback.
  - `FR-072` Support basic comments or feedback snippets where page specs include them.
  - `FR-073` Keep social operations auditable and rate-limited.
- Deferrals: Nested replies, comment moderation UI beyond admin basics, public/private favorite folders.

### CAP-009 Agent Skill / MCP Tooling

- User value: The actual privacy-sensitive work happens locally in the user's agent environment.
- Inputs: Local knowledge source path, raw notes/documents, manifest JSON, exchange ID, module ID, private repo/project path.
- Outputs: Manifest, redaction summary, validation report, private repo package, submitted feedback payload, installation/config examples.
- Dependencies: `CAP-004`, `CAP-005`, `CAP-010`, `CAP-012`.
- Acceptance notes:
  - `FR-080` Show Agent Skills catalog with Create Manifest, Redact Knowledge, Validate Manifest, Package Private Repo, Submit Feedback.
  - `FR-081` Provide install/docs affordances for each skill.
  - `FR-082` Show MCP configuration example and local command examples.
  - `FR-083` Support source categories: Obsidian, Logseq, Notion, Markdown, Yuque, Lark Docs, local folder, custom format.
  - `FR-084` Mark privacy level and local execution status for each skill.
- Deferrals: Real MCP server implementation, local model redaction, automatic GitHub repo creation, and signed agent identity.

### CAP-010 Privacy, Safety, And Consent

- User value: The product is trustworthy only if it makes private data boundaries explicit and enforceable.
- Inputs: Manifest content, redaction findings, sensitivity declaration, contact method, user consent, reports.
- Outputs: Privacy checklist, consent points, scan warnings/blockers, content commitment, takedown/report states.
- Dependencies: All data-producing capabilities.
- Acceptance notes:
  - `FR-090` Public platform stores manifests and public relationships, not raw notes or private repository content.
  - `FR-091` Require consent before manifest generation touches a scope, before public submission, before contact, and before private exchange.
  - `FR-092` Scan for secrets, emails, phone numbers, IDs, private paths, private URLs, long excerpts, and sensitive third-party data.
  - `FR-093` Require sensitivity declaration and redaction notes.
  - `FR-094` Show content commitment for manifest/package consistency without exposing content.
  - `FR-095` Support reporting and takedown path.
- Deferrals: Strong PII detection, Merkle proof implementation, local LLM redaction, and policy-specific compliance modules.

### CAP-011 Admin And Moderation

- User value: Public quality and privacy safety need an operating loop before trust can scale.
- Inputs: Submitted manifest, privacy scan result, reports, risk level, submitter signals, rate-limit state, audit log.
- Outputs: Review queue, risk summary, approve/reject/request changes actions, report handling, audit trail.
- Dependencies: `CAP-004`, `CAP-006`, `CAP-008`, `CAP-010`.
- Acceptance notes:
  - `FR-100` Show moderation queue by pending, flagged, reports, rate limits, and audit log.
  - `FR-101` Show manifest risk level, privacy risk summary, issue list, and submitter signals.
  - `FR-102` Allow approve/publish, reject, and request changes.
  - `FR-103` Track admin action history.
  - `FR-104` Support report handling and basic user/module sanctions.
- Deferrals: Automated policy engine, batch moderation, appeal workflow, and advanced abuse detection.

### CAP-012 Open API And Agent-Readable Registry

- User value: Agents can integrate with Know-share without scraping pages.
- Inputs: Public registry data, module/user/exchange/feedback filters, authenticated submission or feedback payloads.
- Outputs: Public module/user/exchange APIs, submission API, feedback API, search API, rate-limit responses.
- Dependencies: `CAP-002`, `CAP-003`, `CAP-005`, `CAP-006`, `CAP-009`, `CAP-010`.
- Acceptance notes:
  - `FR-110` Provide read APIs for public modules, users, exchange records, and search.
  - `FR-111` Provide authenticated submission and feedback operations once contracts are approved.
  - `FR-112` Ensure API output never includes private content.
  - `FR-113` Apply rate limits and abuse controls.
- Deferrals: GraphQL, webhooks, public registry mirror, and signed agent requests.

### CAP-013 Notifications

- User value: Exchange and review workflows need reminders to close the loop.
- Inputs: Exchange request, accept/reject, review decision, feedback due, comment/recognition event.
- Outputs: In-app notification list and later email/webhook events.
- Dependencies: `CAP-004`, `CAP-005`, `CAP-006`, future auth/session.
- Acceptance notes:
  - `FR-120` Notify on exchange request, accept/reject, feedback due, module review result, and received feedback/comment.
  - `FR-121` Keep MVP notification channel in-app unless a later decision adds email.
- Deferrals: Email, GitHub issue/comment notification, webhook, agent inbox.

## Non-Functional Requirements

| ID | Requirement | Acceptance Notes |
| --- | --- | --- |
| `NFR-001` | Privacy-first data minimization | No release-critical path may require uploading raw notes, full excerpts, private paths, credentials, private embeddings, or unsanitized third-party personal data. |
| `NFR-002` | Agent-readable by design | Public registry and contracts must be usable by agents through structured manifests and later APIs. |
| `NFR-003` | Traceable implementation | Every page, component, API, mock, and test must trace back to stable FR/NFR IDs. |
| `NFR-004` | Open-source auditability | Rules, schemas, trust explanations, and privacy boundaries should be inspectable in repo artifacts. |
| `NFR-005` | Human consent gates | Manifest submission, contact, and private exchange require explicit owner control. |
| `NFR-006` | Abuse resistance | Social signals, feedback, submissions, and reports need identity checks, uniqueness constraints, rate limits, and audit trails before public launch. |
| `NFR-007` | Accessible public website | Public pages must be keyboard-navigable and readable across desktop/mobile once frontend implementation begins. |

## MVP Slicing

### V0.1 Public Registry MVP

Goal: prove that agents can discover useful sanitized manifests without raw content exposure.

- Include `CAP-001`, `CAP-002`, minimal `CAP-003`, minimal `CAP-004`, `CAP-009` docs-only, and `CAP-010`.
- Store or serve public manifests.
- Support module list, module detail, manifest validation, privacy checklist, public card preview, and GitHub identity surface.
- Exchange can be a request/contact intent, not a fully automated handoff.

### V0.2 Exchange And Trust MVP

Goal: close the exchange feedback loop.

- Add `CAP-005`, `CAP-006`, `CAP-007`, minimal `CAP-008`, and in-app `CAP-013`.
- Track exchange lifecycle and public exchange records.
- Collect structured feedback and compute first trust level.

### V0.3 Operations And Agent Kit

Goal: make the system governable and agent-friendly.

- Add `CAP-011` moderation.
- Add real `CAP-012` contracts.
- Turn `CAP-009` from docs/mock UI into a CLI/MCP-capable agent kit.

### V1.0 Automation And Network Effects

Goal: scale matching and trust.

- Add GitHub App private repo automation only after security review.
- Add advanced recommendations, trust graph, signed agent identity, webhooks, and stronger privacy proof mechanisms.

## Parallelization Candidates

| Work Package | Can Start After | Owns | Depends On | Notes |
| --- | --- | --- | --- | --- |
| `PKG-001` Registry discovery vertical | `PRODUCT_SPEC.md`, `IA_SPEC.md`, `PAGE_SPEC.md`, mock module data | `CAP-001`, `CAP-002` UI and read models | Shared manifest schema, design tokens | Good first frontend slice. |
| `PKG-002` Module detail vertical | `PAGE_SPEC.md`, `MOCK_DATA_SPEC.md` | `CAP-003` page, manifest preview, source stats | Registry data model, trust summary model | Needs privacy boundary content from `CAP-010`. |
| `PKG-003` Submission and privacy gate vertical | `SERVICE_CONTRACT.md`, manifest validation rules | `CAP-004`, scan result model | Agent skill contracts, privacy rules | High-risk; should not start before privacy spec. |
| `PKG-004` Exchange lifecycle vertical | `BUSINESS_FLOW.md`, `SERVICE_CONTRACT.md` | `CAP-005` request/status/records | Auth, module ownership, feedback model | Needs careful state machine. |
| `PKG-005` Trust and feedback vertical | `LIGHT_DOMAIN_MODEL.md`, `BUSINESS_FLOW.md` | `CAP-006`, `CAP-007` metrics/profile | Exchange completion, feedback events | Can be mocked early, real scoring later. |
| `PKG-006` Agent skills docs/tooling vertical | `PRODUCT_SPEC.md`, `SERVICE_CONTRACT.md` | `CAP-009` docs, commands, examples | Manifest schema, local privacy rules | CLI/MCP implementation should be separate from website UI. |
| `PKG-007` Admin moderation vertical | `BACKEND_SPEC.md`, `MODULE_WORKFLOW_SPEC.md` | `CAP-011` review queue/actions | Submission model, risk scan model | Can follow after public submission pipeline. |
| `PKG-008` Public API vertical | `SERVICE_CONTRACT.md` | `CAP-012` read/write operations | Domain model and auth | Should be contract-first. |

## Open Questions For User Confirmation

| Question ID | Question | Default For Now | Why It Matters |
| --- | --- | --- | --- |
| `Q-001` | Should V0.1 prioritize a static registry + generated website, or an authenticated app with database from day one? | Static registry plus generated/public website first. | Controls stack, data model, hosting cost, and how quickly agents can consume manifests. |
| `Q-002` | Should real exchange requests be in V0.1 or V0.2? | V0.2, with V0.1 limited to contact/request intent. | Avoids early auth/state complexity while privacy model is still settling. |
| `Q-003` | Should admin/moderation ship in the first public release? | Minimal review workflow before public submission is opened; full admin UI later. | Public user submissions without review increase privacy and abuse risk. |

## Gate Result

```text
Gate: 01-product-gate
Status: needs-user-confirmation
Evidence: FUNCTION_OUTLINE.md compared against README.md, docs/mvp.md, docs/privacy-model.md, docs/data-contract.md, examples/knowledge-module.manifest.json, and docs/design/*.png. File existence checked with `test -f FUNCTION_OUTLINE.md`.
Findings: The capability map is intentionally broad because the UI set covers discovery, detail, exchange, trust, Agent skills, submission, and moderation. MVP slicing is included to control scope.
Decision: Continue only after user confirms or revises Q-001 through Q-003 and the MVP slicing.
```
