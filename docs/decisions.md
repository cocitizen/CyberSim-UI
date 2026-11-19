# CyberSim Decisions

This is the authoritative record for consequential decisions that affect CyberSim across repositories. Record a decision when its rationale would help a future contributor avoid reversing an important constraint, misunderstanding an accepted tradeoff, or repeating a failed assumption.

Routine implementation choices belong in code and version history. Planned work belongs in [the system backlog](cybersim-backlog.md). Consequential questions that have not been decided belong under **Open questions** without a decision number.

## Decisions

### D-001 — Use scenario-scoped identifiers for imported content

**Status:** Accepted  
**Affected repositories:** CyberSim-Backend, CyberSim-UI

**Context:** CyberSim scenarios can share Airtable records and therefore can contain identical Airtable record IDs. Treating an Airtable ID as globally unique caused duplicate-key failures when a second scenario reused shared content.

**Decision:** Static scenario tables use `(id, scenario_id)` composite primary keys. Static relationships that carry `scenario_id` use corresponding composite foreign keys. Runtime game tables do not carry `scenario_id`; application logic preserves their scenario isolation and prevents deletion of scenario data while games reference it.

**Consequences:** Code and migrations must not assume that an Airtable record ID uniquely identifies content without its scenario. Changes to scenario loading, lookup, joins, or deletion must preserve scenario scoping.

**Evidence:** Backend migrations `20260330000000_scenario_tables_composite_pk.js` and `20260330000200_remaining_tables_composite_pk.js`.

### D-002 — Use CyberSim-UI as the system documentation home

**Status:** Accepted  
**Affected repositories:** All

**Context:** CyberSim is maintained across UI, Backend, website, and resources repositories. Component-specific documentation has a natural owner, but cross-repository and ambiguously owned information needs a predictable starting point.

**Decision:** CyberSim-UI is the default home for system-wide and ambiguously owned project knowledge. It owns the system overview, this decision record, and the single system backlog. Component behavior, implementation details, and operations remain documented in the repository that owns them. Repositories should link to authoritative information rather than duplicate it.

**Consequences:** When the owner of project information is unclear, contributors should look in CyberSim-UI first. Moving information into UI does not make UI authoritative for Backend behavior, website content, or released facilitation materials.

### D-003 — Distinguish historical NDI attribution from current affiliation

**Status:** Accepted  
**Affected repositories:** All

**Context:** CyberSim originated as a National Democratic Institute (NDI) project, so NDI may appear legitimately in historical attribution, background, licensing, or other contextual documentation. At the same time, current visual identity and public copy should not accidentally imply an active NDI affiliation where none is intended.

**Decision:** Retain accurate and relevant historical or contextual references to NDI, including the NDI/NED/Microsoft origin note in the UI README. Review each reference in context rather than removing it merely because it mentions NDI. New branding, contact information, or copy that implies a current affiliation requires deliberate review.

**Consequences:** Cleanup work should preserve truthful provenance and useful historical context while correcting genuinely misleading current-affiliation signals. The UI README is an example of deliberate attribution, not the sole permitted NDI reference.

## Open questions

### Should Lightsail replace the working Beanstalk deployment?

**Status:** Evaluation preparation authorized on 2026-11-04; isolated live trial
approved on 2026-11-09. The owner will run Terraform apply personally.
Production adoption, deployment, and cutover remain unapproved.

**Proposal:** Evaluate one modest Lightsail Linux instance running Caddy and
the backend with Docker Compose, keeping React on Amplify and PostgreSQL on
private RDS. Preserve the retired Beanstalk Terraform root separately. Use a
temporary independent private RDS test instance and an isolated Amplify test
frontend. The owner is comfortable using a new Amplify app for the experiment;
that is the implemented test setup under isolated-trial approval. Leave
production infrastructure, data, DNS, and frontend configuration unchanged.

**Rationale and tradeoff:** Expected usage is usually one active game and at
most about twelve connected devices. Avoiding a dedicated ALB may reduce costs;
one host introduces a single failure point and responsibility for patching,
replacement, certificates, and recovery. Running both deployments during the
evaluation temporarily adds cost. Routine connection drops are unacceptable;
test recovery from deliberate maintenance separately from normal stability.

**What's needed to resolve it:** Review the complete running-cost estimate,
isolated Terraform plan, secrets and state arrangements, host maintenance and
replacement procedure, real Socket.IO reconnect tests, representative load,
and database-compatible deployment/rollback runbook. Approve live evaluation
separately, then decide on production adoption and cutover based on evidence.
See [the system backlog](cybersim-backlog.md) and the draft
[Backend migration plan](../../CyberSim-Backend/docs/plans/lightsail-migration.md)
for phases, proposed acceptance targets, separate live-change approvals, and
next actions. The plan is not an accepted production adoption decision.

**Trial implementation and evidence:** The owner provisioned the independent
trial root and separate private RDS/manual-release Amplify app, then completed
SSM enrollment, pinned migrations, restricted app-role setup, synthetic loading
and backend/frontend deployment. API health and frontend delivery pass with
verified HTTPS; custom frontend `lightsail.cybersim.app` is working. Full hosted
gameplay, stability/load and recovery acceptance remain open. The
[Backend runbook](../../CyberSim-Backend/docs/aws-lightsail-deployment.md) owns
current setup commands/evidence; do not reapply historical saved plans.

**Administrative access selected:** The owner chose AWS Systems Manager
Session Manager after changing VPN addresses made IP-based SSH troublesome.
Use native CLI shells and SSH/SCP **inside SSM**, keeping strict host-key checks
and the existing operator SSH key. Routine public inbound access is only 80/443;
no bastion, Tailscale or administrator-IP rule is needed for this trial.

Lightsail uses a dedicated hybrid managed-node role, not an EC2 instance profile.
A one-node/one-hour activation is created outside Terraform and consumed through
hidden prompts during temporary AWS-browser-only SSH access. Verify node identity,
collect the host key through authenticated SSM and prove tunneled staging, then
retire the activation and close console SSH through a reviewed plan. The node
role denies Parameter Store reads and has no application-secret/command-dispatch
permissions. Keep activation and root-owned managed-node credentials out of
Terraform/user data/images and away from application containers. Retain existing
operator login/MFA; review scoped operator permissions before production.

The owner personally runs **all Terraform applies and remote host commands/file
transfers**, including SSM Run Command, shells and SSH/SCP. The agent prepares
local changes, checks and reviewable plans. This access direction is accepted
for the trial; it does not accept production adoption or an availability SLA.
The [SSM guide](../../CyberSim-Backend/docs/aws-lightsail-session-manager.md)
owns enrollment, closure, recovery and credential/logging tradeoffs.

**Future scaling:** The owner reaffirmed the Lightsail trial while considering
managed scalable alternatives. Assess predictable failed-release/host recovery
as well as cost and normal gameplay stability before choosing production hosting.

ECS on Fargate remains a candidate if managed host operations, availability, or
dynamic scaling later justify its cost and infrastructure. It can run the
existing Socket.IO container; a protocol rewrite is not a prerequisite.
Multiple active tasks would require shared realtime updates, suitable routing,
safe concurrent game mutations, and deployment/reconnect testing. A possible
HTTPS-command/SSE redesign is a separate proposal, not an accepted dependency
of the Lightsail trial or a commitment to rebuild. No ECS implementation or
production hosting choice is authorized by this discussion.

### Should static data fetching follow the active game's scenario, not the ambient slug?

**Why it matters:** The frontend resolves two different scenario slugs that nothing currently reconciles: the *ambient* slug used to fetch static reference data (from hostname or `REACT_APP_SCENARIO_SLUG`), and the scenario an *active game* is actually bound to (stored on the game row). When these drift — e.g., a stale env value after a scenario change without an app restart — the UI fetches static data for the wrong scenario while rendering a game bound to a different one, producing dangling ids (systems/roles/`required_systems` resolve to nothing). This was the confirmed root cause of the reskin-era "mismatch" errors.

**Current state:** Mitigated, not resolved. Null-safety guards in the action components (fail visibly rather than silently) and a slug-match regression test are in place; the underlying design gap remains.

**What's needed to resolve it:** A decision on whether `StaticDataProvider` should source static data by the active game's `scenario_id` instead of the ambient slug, and what that changes for screens with no active game yet (e.g., scenario selection before a game exists).
