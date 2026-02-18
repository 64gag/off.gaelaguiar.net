# AGENTS.md — Engineering Rules of the Repo

## 0) Prime directive

- Prefer established best practices and widely adopted conventions.
- Deviate only with an explicit, documented rationale (ADR when consequential).

## 1) Engineering cornerstones

- Automation and executability are queens.
- Fast iterations (small batches, tight feedback loops).
- Dependency awareness and evaluation (cost, risk, maintenance).
- Keep economics in mind (optimize total cost of change, not ideology).
- Source of truth: executable/actionable artifacts define reality.

Team expectation: contributors are comfortable reading code and tests, navigating the repo, and using CI as the canonical reference.

## 2) Single source of truth and documentation policy

- If there is a single executable/actionable source of truth (CI, tests, code, scripts), **do not generate or maintain documentation that duplicates it**.
- “Minimum surface area, maximum quality” documentation exists **only** where there is no single executable/actionable source of truth (see §6).

## 3) How to run / test / deploy

There must be **no separate documentation** explaining how to run, test, or deploy.
People are expected to **deduce those commands from the CI configuration**.

Requirements:

- CI must be readable: clearly named jobs/steps and explicit commands.
- CI commands must be locally reproducible (no hidden magic).
- If you introduce or change a command, update CI accordingly.

## 4) Definition of Done (for any change)

A change is “done” only if:

- Automated checks pass (as defined by CI).
- The change has automated coverage at the **right level** (unit/service/e2e), unless explicitly justified.
- Any required non-executable artifacts are updated (see §6).
- Operational impact is considered for production-relevant changes (see §9 and §10).

When delivering work, include:

- A short summary of intent and impact.
- The exact CI-equivalent commands used to verify locally (or explain why not possible).
- Risks + rollback notes when relevant.

## 5) Workflow and delivery

- Prefer trunk-based development and small PRs.
- Avoid drive-by refactors. Refactor only when required for the task, or isolate as a separate change.
- Keep development and production as close as possible (**dev/prod parity**). Minimize divergence between local/CI/staging/prod.

Avoid ClickOps:

- Infrastructure and configuration changes should be version-controlled and reviewed (IaC/GitOps style).
- No “silent console drift” without a recorded rationale and remediation plan.

## 6) Documentation and required non-executable artifacts

Documentation must be **minimum surface area, maximum quality**:

- Only write docs that reduce operational or cognitive load where no single executable truth exists.
- Keep them short, accurate, findable, and maintained.

Non-executable artifacts that are required (when applicable):

- ADRs (Architecture Decision Records) for consequential decisions/tradeoffs.
- Runbooks / incident notes for operationally critical components.
- Migration notes and rollback strategy for data/schema changes.
- Threat-model notes for security-sensitive features or changes.

Rule: If a decision, operational procedure, or safety constraint cannot realistically be expressed as executable tests/code/CI, it belongs here.

## 7) Testing strategy

- Every change has automated coverage at the **right level** (unit/service/e2e).
  - Default to unit tests for logic.
  - Use service/integration tests for boundary-crossing behavior.
  - Use e2e tests for critical user journeys only (keep them few, stable, high-signal).

TDD / BDD:

- Often desirable and strongly encouraged when it improves design and communication.
- Not mandatory as a ritual.
- Don’t force Cucumber/Gherkin; use them only when they clearly add value.

## 8) Code review norms (Google-style guidance)

- Optimize for continuous improvement.
- Don’t block on perfection.
- Avoid personal-preference arguments; focus on correctness, clarity, maintainability, performance, security, and risk.
- Mark “nits” as non-blocking and keep forward progress.

## 9) Dependency management and lock-in

- Be dependency-aware: evaluate cost, risk, maintenance, and ecosystem maturity.
- Avoid accidental lock-in; accept deliberate lock-in only with an exit plan:
  - data export story / open formats where feasible
  - portability layer or alternative path
  - documented rationale (ADR when meaningful)

## 10) Observability and operability (production is part of development)

For production-impacting code paths:

- Logs:
  - Structured logs where possible; no secrets; include correlation identifiers when useful.
- Metrics:
  - Track throughput, latency, errors, saturation where applicable.
  - Ensure new critical paths emit at least basic error/latency signals.
- Tracing:
  - Add tracing/correlation where it materially reduces diagnosis time.
- Operational signals:
  - Health checks and readiness signals where applicable.
  - Alerting thresholds for critical failures.
  - Dashboards or a minimal query set referenced from runbooks (when needed).
- Recovery and safety:
  - Timeouts, bounded retries, backoff, circuit-breaking as appropriate.
  - Idempotency where relevant.
  - Feature flags or progressive rollout for risky changes.
  - Explicit rollback plan for deployments and migrations.

## 11) Safety rails (common instructions)

Secrets and credentials:

- Never commit secrets, API keys, private tokens, or production credentials.
- Never print secrets to logs or test output.
- If a secret is exposed, treat it as compromised: rotate/revoke and document the incident.

Data safety:

- Never run destructive operations (drops, truncates, irreversible migrations) without an explicit rollback plan.
- Prefer backward/forward-compatible schema changes; stage risky changes.
- Protect PII: minimize collection, restrict access, and avoid copying production data into dev unless explicitly approved and sanitized.

Security posture:

- Use least privilege for services, CI tokens, and runtime permissions.
- Validate and sanitize untrusted input; avoid unsafe parsing and shell injection risks.
- Keep dependencies up to date; remove unused dependencies.
- Prefer maintained libraries; avoid unreviewed code execution paths.

Build and supply chain:

- Keep lockfiles consistent; do not edit them manually unless required by tooling.
- Avoid adding heavyweight dependencies without clear justification and alternatives considered.
- Respect licenses; avoid introducing incompatible licensing without review.

Operational caution:

- Avoid commands that can damage the environment or data (`rm -rf`, recursive deletes, mass rewrites) unless explicitly required and clearly scoped.
- Prefer reversible changes; add guardrails (dry-runs, confirmations, scoped targets).

Agent behavior expectations:

- Don’t “guess” critical config values (ports, env vars, credentials, prod endpoints). Use repo truth (CI/config) or add explicit configuration.
- When uncertain about risk (security/data/production), choose the safer path: smaller change, feature flag, staged rollout, or add tests/guards.

## 12) Commits and PR metadata

Commits:

- Use the most widely adopted commit convention: **Conventional Commits**.
- Keep messages minimal but informative; avoid bikeshedding.
- Use the convention primarily to enable tooling (release notes, automation), not as a purity test.

PRs:

- Keep PRs small and reviewable.
- PR description should include:
  - what changed and why
  - how it was verified (CI-equivalent commands)
  - risks and rollback notes (if relevant)

## 13) Scripts and “executable documentation”

Scripts should be executable-first and user-friendly:

- Provide `--help` / `-h` output describing usage and examples.
- Prefer long-form CLI options in scripts (readability).
- Minimal error checking is fine; assume competent users.
- Avoid verbose header comments as a substitute for `--help`.
- Use descriptive names; do not compress names for “brevity”.

## 14) Comments in code

Comments are not a substitute for tests.
When used, comments must explain:

- why (intent/tradeoff)
- invariants/constraints
- non-obvious edge cases
- external quirks (APIs, protocols, undefined behavior)

Never narrate what the code already makes obvious.

## 15) Repo map

- `archetypes/`: Hugo content archetypes.
- `content/`: Source content in Markdown (English and French).
- `layouts/`: Hugo layout templates and partials for the terminal UI.
- `static/`: Source static assets copied into generated output.
- `themes/`: Git submodule with theme source used by Hugo.
- `.github/workflows/`: CI source of truth.
- `docs/`, `public/`, `resources/`, `node_modules/`: generated directories; do not edit by hand.
- Critical systems: deployment output generation (`hugo --destination docs`), CI pipeline (`.github/workflows/ci.yml`), Dockerized runtime and validation (`Dockerfile`, `docker-compose.yml`).
- Accepted risk: local preview binds to `0.0.0.0` and publishes `1313` intentionally for LAN/mobile testing; treat it as a non-production convenience and avoid untrusted networks.
