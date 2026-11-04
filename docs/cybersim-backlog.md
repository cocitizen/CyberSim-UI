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

**Status:** Needs triage; identified by inspection, not reproduced

**Next actor:** UI contributor

`src/components/GameStore.jsx` registers the handler that emits `JOINGAME` using
`socket.on('reconnect')`. In Socket.IO v4, reconnection events belong to the
Manager (`socket.io`), while the Socket's `connect` event fires on both initial
connection and reconnection. The current handler therefore appears unable to
restore server-side game membership after a lost connection.

Next action: fix the lifecycle handler and verify that facilitator and projector
clients rejoin the game, reload current state, and receive subsequent updates
after restarting a local test backend. Existing tests manually invoke the
registered handler, so they do not establish that the library emits that event
on the object being observed. This applies to Beanstalk and any replacement host.

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

**Status:** Evaluation preparation authorized 2026-11-04; implementation pending;
no AWS changes or production cutover authorized

**Plan:** [Backend Lightsail migration plan](../../CyberSim-Backend/docs/plans/lightsail-migration.md)
— draft for owner review, covering baseline inspection, local implementation,
isolated trial, production readiness, cutover/rollback, and retirement. Live
trial, production preparation, routing cutover, and retirement have separate
approval points. Interruption and observation targets are proposals to validate.

**Next actor:** Backend contributor to implement and locally validate the
isolated deployment; UI contributor to prepare reconnect recovery and the test
frontend configuration. Present concrete plans and live-test steps for owner
approval before deployment.

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
drafted; next action is its phase 1 baseline/input inventory, followed by local
implementation/validation and review of the concrete infrastructure plan and
live acceptance procedure. Public website claims and facilitation
resources are unaffected by this preparation; reassess them before cutover.

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
