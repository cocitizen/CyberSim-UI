# CyberSim Backlog

This is the single system-wide backlog for all CyberSim repositories. Component-specific documentation remains with its owning repository, but planned and potential work is collected here so cross-repository work has one authoritative home.

This file tracks bugs, rough edges, deployment follow-ups, documentation updates, and feature ideas that are worth preserving but not necessarily scheduled.

Items here are not commitments. When something becomes planned work, give it a clear status and next actor here, then link any implementation branch or pull request. Move to an issue tracker only if the project later needs stronger assignment, discussion, notification, or filtering capabilities.

## Needs triage

Items captured quickly, before we decide whether they are bugs, enhancements, docs updates, or future ideas.

### Example item title

**Type:** Bug / enhancement / docs / ops / admin UX / gameplay  
**Source:** Where this came from  
**Priority:** Low / medium / high  
**Effort:** Small / medium / large  
**Status:** Needs triage  

Notes:

- What happened?
- Why does it matter?
- Any links, commands, screenshots, or examples?

## Bugs and confusing behavior

Things that are broken, misleading, or likely to confuse users or maintainers.

### Restore game membership after a Socket.IO reconnect

**Type:** Bug / runtime resilience

**Source:** ECS migration assessment; source and Socket.IO v4 documentation review

**Status:** Implemented and verified locally; not deployed; browser/live trial
acceptance remains pending

**Next actor:** Operator after approval of the isolated trial

The former handler used `socket.on('reconnect')`, which does not provide Socket.IO
v4 Socket lifecycle recovery. `src/components/GameStore.jsx` now rejoins on
`connect`, reloads the game snapshot before enabling commands, retries only the
idempotent join/snapshot step, ignores stale acknowledgements, and clears a
missing game. No game command is automatically replayed during recovery.

The companion `scripts/verify-reconnect.cjs` exercises the actual UI store and
real Socket.IO clients against an owned disposable local Backend/database:
WebSocket and polling restarts, membership/snapshot recovery, subsequent live
updates, a short twelve-client check, and missing-game recovery passed. This is
a Node integration harness with browser timing/storage shims, not a browser or
live-host acceptance result. Next: validate the facilitator/projector flows and
the agreed recovery/soak targets through the approved Amplify/Lightsail trial.

Reference: [Socket.IO client lifecycle documentation](https://socket.io/docs/v4/client-socket-instance/#events).

### Replace misleading “Backend not reachable” message

**Type:** UX / bug  
**Source:** Rodrum scenario setup  
**Priority:** High  
**Effort:** Small / medium  
**Status:** Backlog  

The UI displayed:

```text
Backend not reachable at https://api.cybersim.app
```

even though the backend, CORS, and Airtable access were working.

The real backend error was:

```json
{
  "error": "SCENARIO_NOT_FOUND",
  "message": "Scenario not found: \"rodrum\""
}
```

Better behavior:

- distinguish backend unavailable from scenario-loading errors;
- show a clearer message for unknown scenario slugs;
- suggest running scenario import when a scenario exists in Airtable but has not been imported into PostgreSQL.

## Setup and operations improvements

Improvements to deployment, scenario setup, health checks, imports, hosting, or maintenance workflows.

### Review RDS deletion protection

**Type:** Ops / hardening

**Source:** Read-only AWS teardown safety review, 2026-10-27

**Status:** Needs owner review

**Next actor:** Owner to decide whether to enable deletion protection; Backend
contributor to implement if authorized.

The existing `cybersim-prod-db` instance has deletion protection disabled and
seven-day automated backup retention. The Beanstalk experiment destroy plan
does not manage or delete this database. Consider enabling deletion protection
as independent hardening. See the Backend
`infra/aws-elasticbeanstalk/README.md` for the experiment's production-safety
evidence. This is a historical observation from 2026-10-27, not a fresh check.

### Add scenario setup validation endpoint

**Type:** Ops / admin  
**Source:** Rodrum scenario setup  
**Priority:** Medium  
**Effort:** Medium  
**Status:** Backlog  

Create an endpoint that checks whether a scenario is fully ready.

Possible endpoint:

```http
GET /admin/scenarios/:scenarioSlug/status
```

Possible checks:

- `AIRTABLE_BASE_IDS` includes the scenario slug;
- Airtable base is reachable;
- required Airtable tables exist;
- scenario has been imported into PostgreSQL;
- scenario data routes return expected values;
- frontend origin is allowed by CORS.

### Add EB deployment script

Create `scripts/deploy-eb.sh` to package the backend, create an EB application version, and deploy it to the selected EB environment.

### Prepare an isolated Lightsail deployment alongside Beanstalk

**Type:** Ops / hosting

**Status:** Local implementation and proportionate local verification complete; read-only AWS
inventory and create-only example plan prepared. No AWS changes, uploads,
deployment, or production cutover authorized or performed.

**Plan:** [Backend Lightsail migration plan](../../CyberSim-Backend/docs/plans/lightsail-migration.md)
— draft for owner review, covering baseline inspection, local implementation,
isolated trial, production readiness, cutover/rollback, and retirement. Live
trial, production preparation, routing cutover, and retirement have separate
approval points. Interruption and observation targets are proposals to validate.

**Operations:** [Backend trial operator guide](../../CyberSim-Backend/docs/aws-lightsail-deployment.md)
documents the implemented workflow and verification limits. The trial uses a
separate manual-release Amplify app, not a production app branch or Git token.

The owner reaffirmed the Lightsail trial on 2026-11-06. ECS/Fargate is a future
dynamic-scaling candidate; the comparison does not change the active trial.
See the [hosting decision discussion](decisions.md#should-lightsail-replace-the-working-beanstalk-deployment)
for the unresolved scaling/transport choices. Predictable recovery from a failed
release and host replacement remains a key trial acceptance check.

**Next actor:** Owner to supply operator SSH public key/CIDRs, confirm trial
hostnames, state recovery
location and lifetime, and review the regenerated actual plan/artifacts for
approval A. Relevant DNS/proxy settings also need checking before test DNS
configuration. The plan now separates completed local tasks from live acceptance
and later production-only schema/secret checks. Public trial and production steps
remain separate approvals.

Verification-only Backend helpers now live in `tests/lightsail/`; operator
commands remain in `scripts/lightsail/`. The Backend operator guide places new
private working files outside source checkouts and configures local Terraform
state there. Existing EB private files remain preserved. Confirm an encrypted,
recoverable backup destination before provisioning.

The owner wants to evaluate a single Lightsail Linux instance running Caddy and
the existing backend with Docker Compose, retaining Amplify and private RDS.
Expected load is usually one active game and at most about twelve concurrent
devices. A deliberate maintenance interruption is different from recurring
connection drops: normal operation should not cause routine reconnects, and
noticeable recovery delays require investigation. Resolve and test the reconnect
issue above before relying on automatic game recovery.

The parallel Terraform-managed Beanstalk experiment was torn down on
2026-10-27. Production remains on its separate Beanstalk environment. The
Backend `infra/aws-elasticbeanstalk/README.md` records teardown scope and
verification. The complete root was renamed from `infra/terraform/`, preserving
its ignored state, backup, variables, and provider cache. Current local state
is empty; the backup retains the historical resources. No apply was performed.

Reviewed evaluation scope and implementation proposals:

- Use Backend `infra/aws-lightsail/` as an independent root and state arrangement.
  Preserve the Beanstalk IaC and never reuse its variables, state, or plans.
- Use a separate temporary private RDS test instance, independent credentials,
  and synthetic data. The owner accepts its short-term cost. Do not connect
  tests to production or change production database configuration.
- Prepare an isolated test frontend in a separate Amplify app; the owner is
  comfortable creating a new app for the experiment. Reuse existing build
  conventions, with independent test API/domain/deployment settings. Creation
  and deployment remain part of the reviewed live-trial approval.
  The requested test hostname is
  `lightsail.cybersim.app`; settle its frontend/API assignment and the second
  hostname before preparing DNS changes. Leave production frontend configuration
  and DNS unchanged.
- Proposed starting size: 2 GB Linux instance, subject to cost and load
  validation. Use restricted SSH and operator-delivered host secrets rather
  than persistent AWS credentials on Lightsail. Keep secrets out of Terraform
  user data, state inputs, images, logs, and version control.
- Common preparation: verify reconnect/rejoin with real clients across backend
  restart; explicitly close sockets and database connections on shutdown;
  separate migrations from serving traffic; review atomic gameplay mutations
  and retry behavior; review runtime permissions.
- Owner-confirmed prerequisites: container-build hardening and verified database
  TLS. Use explicit runtime image inputs, a restricted build context, and
  synthetic context/layer exclusion checks; verify RDS certificate chains and
  hostnames with real-driver success/rejection tests and no insecure fallback.
  The Backend plan owns the detailed checklist and evidence. These improvements
  must pass before the Lightsail trial release; deploying them to working EB
  remains a separately reviewed action.
- Use the existing Jest and Playwright tools for an isolated, synthetic
  facilitator/projector test covering restart, refresh, rejoin, and subsequent
  updates. Keep test data separate from production. Deploy a fixed image digest,
  with a documented rollback and database migration compatibility plan.
- Terraform should manage new application infrastructure separately from
  existing shared resources, with private state, explicit teardown boundaries,
  and a complete running-cost estimate before provisioning.
- Verify existing shared peering before proposing changes. Keep RDS private,
  scope ingress narrowly, and account for the instance's changed private address
  after replacement.
  The read-only baseline found peering disabled; the locked provider does not
  model Lightsail peering, so the proposed one-time CLI step is explicitly
  reviewed separately and never undone by trial Terraform destruction.
- Document bootstrap, host maintenance/replacement, pinned application releases,
  health checks, bounded logs, acceptance/load tests, and database-compatible
  rollback. Preserve Beanstalk, RDS, and shared resources until a separately
  approved production cutover and eventual cleanup.
- Frontend tooling modernization is a separate workstream: React 16.14 and
  Create React App 5 remain in the lockfile. Assess replacing CRA and upgrading
  React in distinct changes; neither requires a new rendering architecture.

Companion local branches: `codex/lightsail-deployment` in CyberSim-Backend and
CyberSim-UI. Repository cleanup preserves the pre-existing documentation edits;
no pull requests, pushes, deployments, or live changes have been made for this
work. Backend `infra/README.md` maps roots and
`infra/aws-lightsail/README.md` records preparation scope. The migration plan is
drafted and the trial code is implemented locally. The authenticated example plan
contains eleven creates and no changes/deletes; its reserved SSH CIDR/ephemeral
key are not deployable inputs. Regenerate it with actual approved access before
requesting live-trial approval. Public website claims and facilitation
resources are unaffected by this preparation; reassess them before cutover.

Local implementation commits are Backend `056a3a6` and UI `35c7ab7`. Checks
passed: 144 Backend tests, 26 UI tests, lint, secret scan, clean image/frontend
builds, real Compose/Caddy polling/WebSocket workflows and restart readiness,
verified database TLS and restricted role, actual GameStore reconnect recovery,
and a short twelve-client check. Detailed evidence and outstanding live checks
are in the Backend operator guide; no browser, public TLS, cloud bootstrap,
remote rollback, sustained-load, or soak acceptance is claimed.

### Complete remaining Backend dependency-audit disposition

**Type:** Security / dependencies

**Status:** Production findings resolved locally; deployment remains unapproved

**Next actor:** Operator to refresh the audit and review pinned artifacts before approval A

The initial trial hardening reduced the production audit from 17 findings
(including one critical) to seven. The owner then authorized a controlled Knex
0.21.21 to 3.3.0 upgrade and compatible dependency updates. The production audit
now reports zero findings. Its install removes the old CLI chain and keeps Jest
type definitions development-only: 157 production packages versus 306 before.
No application query or schema migration edits were needed. The full Backend
suite, real reconnect workflows, and a synthetic old-to-new migration-history
and scenario export/import rehearsal passed. The Backend operator guide records
build evidence and limits. Nothing has been deployed, and this does not assert
that the application is free of vulnerabilities.

### Refresh Backend runtime and development packages

**Type:** Maintenance / security

**Status:** Backend-only refresh completed locally on 2026-11-06; no deployment authorized

**Plan:** [Backend dependency refresh](../../CyberSim-Backend/docs/plans/backend-dependency-refresh.md)

The owner authorized the broader Backend refresh on 2026-11-05 and explicitly
left React/frontend tooling as separate backlog work. Current stable Backend
packages now include Express 5, Pino 10/pino-http 11, Helmet 8, Yup 1, Jest 30,
ESLint 10 and Node 26 LTS. Deprecated/redundant middleware and the unused Jest
lint plugin/TypeScript peer chain are removed. All 159 enabled lint rules are
retained. Source remains JavaScript; UI package manifests are unchanged.

Node 26 local checks pass the 144-test Backend suite, real Socket.IO reconnect
workflows, and synthetic old-to-new database/scenario rehearsal. Production
packages fall from 157 to 148 with zero production audit findings. The full
audit reports 23 development-only affected packages: 20 moderate, three low,
zero high/critical (2026-11-06). Keep upstream/applicability review open without
forcing unsupported transitive majors or downgrading maintained tools just to
change the audit count. No accepted risk, live release, or production change
is implied. The Backend plan records package versions and final evidence. The clean `5e5eed7`
image passed real Compose/Caddy workflows, backend/proxy credential-canary checks,
and offline runtime/dependency inspection. All owned disposable resources were
removed. The local candidate is `/private/tmp/cybersim-backend-current-candidate`;
rebuild/retain reviewed artifacts before an approved live trial.

Also investigate the intermittent mocked import-route test failure observed
during dependency validation (expected 500, observed 404). The isolated route
suite and fresh full suite passed unchanged; cause is unconfirmed. Preserve the
assertion and reproduce before changing application behavior or claiming a fix.

### Update React and the frontend build toolchain

**Type:** Maintenance / frontend

**Status:** Backlog; explicitly deferred by the owner on 2026-11-05

**Next actor:** Frontend contributor and owner

The owner wants a maintained current package baseline, including major upgrades
where needed, but limited the active refresh to Backend. UI remains on React 16,
Create React App 5, Bootstrap 4/react-bootstrap 1, and older test/build packages.
Plan a separate React update with a maintained build-tool replacement for the
deprecated CRA stack, updated router/components/styles/testing, and a current
Node LTS. Assess react-easy-state compatibility before choosing replacement work.
Retain static Amplify hosting and existing behavior; a new rendering framework
or TypeScript source migration is not assumed. Preserve the public environment
variable/API contract, scenario hostname selection, SPA rewrites, game state and
reconnect behavior. Validate the full browser facilitator/projector/player and
admin workflows, visual layout, unit tests, production bundle and isolated
Amplify trial deployment before any approved production release. Do not push or
trigger a production Amplify build as part of preparation.

## Admin UX improvements

Improvements to screens or workflows used by admins and facilitators.

### Improve first-time scenario import flow

**Type:** Admin UX  
**Source:** Rodrum scenario setup  
**Priority:** Medium  
**Effort:** Small / medium  
**Status:** Backlog  

The Scenario Import popup initially showed only existing scenarios. Rodrum appeared only after running a direct admin import.

Better behavior:

- allow entering a new `scenarioSlug` manually;
- or populate the import list from configured `AIRTABLE_BASE_IDS`;
- or show imported and not-yet-imported scenarios separately.

## Gameplay and product ideas

Ideas that improve the simulation experience for facilitators, participants, or observers.

### Add per-scenario win/support threshold to the backend

**Type:** Gameplay / enhancement  
**Source:** Brand-reskin projector work (2026-06)  
**Priority:** Medium  
**Effort:** Medium  
**Status:** Backlog  

`Projector.jsx` currently hardcodes `SUPPORT_WIN_THRESHOLD = 50`. The `scenario` table has no win/threshold field, so every scenario shares the same stub value regardless of its actual design.

Needs:

- Backend: migration adding a win/support-threshold field (with a sensible default) to `scenario`; expose it via the scenario data endpoint; support it in the Airtable import.
- Frontend: replace the `Projector.jsx` stub constant with the value from `StaticDataProvider`.

Also affects: game length has no dedicated field either — it's currently derived from the final event's `trigger_time`. Worth considering alongside this if touched.

### Example gameplay idea

**Type:** Gameplay  
**Source:** Demo / user feedback / internal testing  
**Priority:** Low / medium / high  
**Effort:** Small / medium / large  
**Status:** Backlog  

Notes:

- Who benefits?
- What problem does this solve?
- Is this necessary for a pilot, or just a nice improvement?

## Documentation updates

Docs that should be added or improved.

### Keep add-a-scenario checklist current

**Type:** Docs  
**Source:** Rodrum scenario setup  
**Priority:** High  
**Effort:** Small  
**Status:** Backlog  

The scenario setup process should document:

- creating or duplicating the Airtable base;
- granting the PAT access to the new base;
- adding the Amplify custom subdomain;
- adding the Cloudflare CNAME;
- updating `UI_ORIGINS`;
- updating `AIRTABLE_BASE_IDS`;
- validating CORS;
- validating Airtable access;
- running the direct admin import;
- confirming scenario data routes work;
- smoke testing the scenario URL.


New Scenario / New URL Bootstrapping Gotchas

When adding a new CyberSim subdomain or frontend deployment, remember that the frontend hostname is not just a URL. It is also part of how CyberSim determines which scenario to load.

For example:

https://beta.cybersim.app

will typically produce:

scenarioSlug=beta

That means a new custom URL can resolve correctly, load the React UI correctly, and still fail if the backend has not been prepared for that slug.

Scenario slugs and Airtable base IDs are not one-to-one

A scenarioSlug does not need to have a unique Airtable base.

Multiple slugs may point to the same Airtable base ID. This is useful for beta deployments, staging deployments, reskins, demos, alternate URLs, or temporary branches where the frontend hostname produces a distinct slug but the content should come from an existing Airtable scenario.

Example:

rodrum  → appXXXXXXXXXXXXXX
beta    → appXXXXXXXXXXXXXX
cso     → appYYYYYYYYYYYYYY

In this model:

custom subdomain → scenarioSlug → Airtable base ID → imported scenario data

The slug is therefore a runtime/playable identity, not necessarily a separate content source.

The hidden bootstrap step

A new slug must be both configured and imported before it works.

The successful chain is:

DNS resolves
→ Amplify serves the UI
→ UI derives scenarioSlug from hostname
→ UI can reach the backend API
→ backend allows the frontend origin via UI_ORIGINS
→ backend knows the slug via AIRTABLE_BASE_IDS
→ scenario data has been imported into Postgres for that slug
→ UI can load usable scenario/game data

The easy-to-miss step is the import/bootstrap step.

Even when UI_ORIGINS is correct and AIRTABLE_BASE_IDS maps the slug to the right Airtable base, the UI may still fail until the scenario has been imported into the database for that slug.

Misleading error: “cannot connect to API backend”

One current gotcha is that an unbootstrapped scenario may throw a generic message like:

cannot connect to API backend

This can be misleading. The backend may be reachable, CORS may be configured correctly, and the Airtable base ID may be correct. The real problem may simply be:

The scenarioSlug exists in configuration but has not yet been imported into Postgres.

So if a new custom URL loads the UI but fails with a backend connection error, check these in order:

1. Does the custom domain resolve?
2. Does Amplify serve the UI?
3. Is REACT_APP_API_URL correct for the frontend build?
4. Is the new frontend URL included in UI_ORIGINS?
5. Is the new scenarioSlug included in AIRTABLE_BASE_IDS?
6. Has the admin import/bootstrap command been run for that scenarioSlug?

If the first five are correct, the likely fix is to run the admin scenario import/bootstrap for the new slug.

Future admin tool need

This is a strong argument for an admin bootstrap tool.

A future admin workflow should let an administrator create or attach a playable slug without remembering the full manual chain.

Minimum useful fields:

scenarioSlug
displayName
Airtable base ID
optional source/alias scenario
import now: yes/no

The tool should then:

Validate that the slug is safe and available
Save the slug → Airtable base ID mapping
Verify Airtable access
Run the import/bootstrap process
Report what was imported
Show the playable URL

Example success message:

Scenario `beta` created.
Airtable base connected.
Import completed.
Open https://beta.cybersim.app

The admin interface should distinguish between creating a genuinely new scenario and creating an alternate playable URL that points to an existing Airtable base.

For now, document this as a manual bootstrapping requirement whenever a new CyberSim subdomain, branch deployment, reskin, or scenario slug is added.



## Done

Completed or resolved items. Keep short notes here so we remember what changed and why.

### Document and retire the Terraform Beanstalk experiment

**Type:** Docs / ops

**Completed:** 2026-10-27

Documented the experiment's scope and shared dependencies, then destroyed its
10 Terraform-managed resources with owner approval. Verified production health,
unchanged API DNS, retained VPC and subnets, shared database identity and access,
TLS certificate attachment, experiment stack deletion, and empty Terraform
state. The Backend `infra/aws-elasticbeanstalk/README.md` retains the evidence and marks
the configuration as historical; applying it would recreate the experiment.

### Example completed item

**Type:** Docs  
**Completed:** YYYY-MM-DD  

Brief note about what was done.
