# Project Context

## Project Name And Artifact Root

- Project: Know-share.
- Active root: `/Users/zyongzhu/Workbase/Know-share`.
- Source import: prior materials were imported from `/Users/zyongzhu/Documents/Codex/2026-06-22/new-chat/Know-share`.
- Current product status: product-design setup with README, MVP, privacy model, public manifest contract, example manifest, and UI design images.

## Existing Materials

- `README.md`: core product intent and lightweight MVP.
- `docs/mvp.md`: smallest useful version as a static public registry plus manifest schema.
- `docs/privacy-model.md`: privacy boundaries, consent points, redaction checklist, and local-first matching.
- `docs/data-contract.md`: public knowledge module manifest fields and validation principles.
- `examples/knowledge-module.manifest.json`: sample manifest.
- `docs/design/`: UI image inputs for discovery, module detail, exchange records, trust profile, agent skills, and submit-module flow.

## Technology Stack And Versions

- No app stack has been bootstrapped in this root yet.
- Existing docs suggest an intentionally lightweight first version: static registry, JSON-compatible manifest schema, and agent-side helper.
- Earlier discussion considered `Next.js + TypeScript + Tailwind + shadcn/ui`, but that is not yet an approved project artifact in this root.

## Critical Implementation Rules

- Do not implement before staged product artifacts define requirements, page contracts, data contracts, and acceptance checks.
- Treat UI images as inputs to normalize, not as implementation contracts by themselves.
- Preserve traceability from every requirement to flows, entities, pages, APIs, tests, and validation evidence.
- Keep implementation work separable for future multi-agent execution: each work package needs explicit inputs, outputs, dependencies, files, and verification commands.

## Testing Commands And Expected Evidence

- No test runner exists yet.
- Before stage 11 frontend implementation, Task Zero must establish a runnable project and green baseline.
- Expected future evidence: install/build/lint/test commands, browser validation for major pages, contract tests for backend/API behavior, and integration release review.

## Code Organization Conventions

- Current repo organization:
  - `docs/` for product, privacy, data, design, and future orchestrator specs.
  - `examples/` for public manifest examples.
  - Root orchestrator files for workflow state and traceability.
- Future implementation directories are not yet created. Their names must be decided in approved frontend/backend specs.

## Security, Data, And Privacy Constraints

- Public registry must not store raw notes, full document text, private paths, credentials, private embeddings, or unsanitized third-party personal data.
- Manifest publication requires local user review before anything leaves the user's machine.
- Private exchange requires explicit owner approval and should happen outside the public registry in the MVP.
- Matching should primarily run on the consuming agent side so user interests and ranking logic can remain local.

## Known Non-Goals And Forbidden Shortcuts

- Do not build a raw knowledge-base hosting platform.
- Do not upload private repositories, embeddings, or full note exports to the public registry.
- Do not make GitHub private repo collaboration automatic in the first implementation without a later security/permission decision.
- Do not let UI mockups silently expand scope beyond the approved product spec.
- Do not create untracked pages, APIs, data fields, or tests during implementation.
