# AGENTS.md

## Project Context

- Product source of truth: `PRODUCT_SPEC.md` once stage 03 passes. Until then, use `README.md`, `docs/mvp.md`, `docs/privacy-model.md`, `docs/data-contract.md`, `docs/design/*.png`, and `FUNCTION_OUTLINE.md` drafts as inputs only.
- Current implementation context: `PROJECT_CONTEXT.md`.
- Artifact manifest: `ARTIFACT_MANIFEST.yaml`.
- ID registry: `ID_REGISTRY.md`.
- Decision log: `DECISION_LOG.md`.
- Change impact log: `CHANGE_IMPACT.md`.
- Traceability matrix: `TRACEABILITY_MATRIX.md`.
- Active stage is declared in `ARTIFACT_MANIFEST.yaml`; do not work ahead of blocked or invalidated upstream stages.
- Do not implement behavior that cannot be traced to approved artifacts or recorded assumptions.

## Product Boundaries

- Know-share is a privacy-first knowledge-module exchange and matchmaking platform for personal agents and the users behind them.
- The public platform stores discovery metadata and sanitized manifests, not raw knowledge bases.
- Private knowledge exchange remains consent-based and outside the public registry unless a later approved contract says otherwise.
- UI images in `docs/design/` are source inputs, not executable page contracts.

## Dev Environment Tips

- No app stack has been bootstrapped yet.
- Before implementation starts, Task Zero must create the app skeleton, package manager setup, test runner, and a green baseline.
- Use the package or app folder that owns the feature before running commands once the stack exists.

## Testing Instructions

- Run focused tests for changed code first once code exists.
- Run the required verification suite before claiming completion.
- Frontend work must include browser validation for release-critical journeys.
- Backend behavior must follow `SERVICE_CONTRACT.md`, `MODULE_WORKFLOW_SPEC.md`, and the test plan once those artifacts exist.
- Stage gates require command output or other executable evidence, not just prose.

## Change Control

- Record changes to scope, IA, data model, service contracts, security, data ownership, or release criteria before implementation.
- Mark downstream artifacts invalidated in `ARTIFACT_MANIFEST.yaml` when approved upstream artifacts change.
- Ask for confirmation before making breaking contract changes or expanding public data collection.
- Keep generated or imported design output subordinate to approved specs.

## Multi-Agent Rules

- Each agent work package must name its upstream artifacts, owned files, dependencies, verification commands, and acceptance criteria.
- Agents should prefer vertical slices that can be built and verified independently.
- Shared contracts, schemas, navigation, auth/session assumptions, and design tokens must be stabilized before parallel implementation begins.
- If an agent discovers an untraced requirement, it should stop that change, record a gap, and route it back through the orchestrator artifacts.

## PR / Review Instructions

- Summarize changed artifacts and implementation evidence.
- Link validation reports and test output.
- Call out accepted risks, deferred work, and open assumptions explicitly.
- Do not claim release readiness until `INTEGRATION_REPORT.md` and `RELEASE_REVIEW.md` pass their gates.
