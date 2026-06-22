# process/ — executable process layer (skill template)

Copy this directory into a project as `orchestrator/process/`. It makes the control artifacts
machine-checkable instead of self-attested. See `rules/orchestrator-state-machine.md` §"Executable
Enforcement" and `gates/_GATE_EVIDENCE.md`.

- `reconcile.mjs` — drift detector / executable gate. Validates the manifest, checks build-claims vs
  git+filesystem reality on the work branch, enforces blocking-consistency, flags staleness vs the
  decision log. Run `node orchestrator/process/reconcile.mjs` (exit 0 clean / 1 drift / 2 missing).
  Zero-dependency (Node ≥18). Wire as a required CI check.
- `manifest.schema.json` — structural + enum contract for ARTIFACT_MANIFEST.yaml.
- `reconcile.config.json` — per-project: `work_branch` + `probes` (stage→path that must exist once the
  stage is past not-started). Example:
  `{ "work_branch": "feat/x", "probes": [ { "stage": "16-backend-tdd", "path": "backend/src" } ] }`

Industry analogues: terraform drift, GitOps reconcile, CI required-checks, policy-as-code, DO-178C
bidirectional traceability, ADR immutable history.
