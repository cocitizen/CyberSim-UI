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

**Status:** Isolated trial deployed; gameplay and operational acceptance pending.
On 2026-11-19 the owner reported the frontend running. Independent public checks
returned HTTP 200 for the Amplify page and its JavaScript bundle, and verified
HTTPS API health returned `{"status":"ok"}`. These checks do not establish
facilitator/player behavior or Socket.IO reliability. Production cutover remains
unauthorized; working EB, production DNS/frontend and production RDS are unchanged.

**Plan:** [Backend Lightsail migration plan](../../CyberSim-Backend/docs/plans/lightsail-migration.md)
owns the detailed implementation, acceptance and production approval checklist.
The [Backend operator guide](../../CyberSim-Backend/docs/aws-lightsail-deployment.md)
owns credentials, releases and recovery; [frontend deployment](aws-amplify-deployment.md#isolated-lightsail-trial)
owns the separate manual-release Amplify flow.

**Next actor:** Commit/recover the reviewed local work and integrate current UI
`origin/main` before building the next acceptance frontend. The deployed
`35c7ab7` predates projector/form-error fixes; a refreshed remote comparison found
eight missing mainline commits. Resolve overlapping docs without undoing Done
items, then run affected UI tests/lint/build and have the owner deploy a new
pinned frontend. Branch publication is a separate owner decision. Afterward, the
owner runs a complete synthetic game with separate facilitator and
player/projector sessions, then checks refresh and network-interruption
rejoin with subsequent updates. Record results in the plan. Follow with the
proposed twelve-client load/observation exercises and owner-operated restart,
deploy/rollback and host-replacement rehearsals before production preparation.
Agree a short trial review/cleanup date and review actual billing.

Current trial: 2 GB Lightsail host with Caddy/backend Compose, private temporary
RDS with synthetic `lightsail` data, and a standalone Amplify app. API:
`https://api-lightsail.cybersim.app`; frontend:
`https://lightsail.d2cjzpyvq3fv5r.amplifyapp.com`. Custom frontend
`https://lightsail.cybersim.app` is also serving after the owner-created Amplify
domain association and Cloudflare records; that association is outside Terraform.
Shared peering is outside disposable state. The existing EB IaC and private state are preserved
under Backend `infra/aws-elasticbeanstalk/`; working production EB is separate.

SSM administration is verified with public SSH closed. Pinned migrations,
fixture loading and the direct-pg/app-Knex authentication/TLS/restricted-role
probe passed under owner operation. Initial bootstrap, SSM version-selection,
Docker image-identity and credential-alignment problems were repaired; rationale
and limits remain in the Backend guide/plan. All Terraform applies and remote
host commands/transfers remain owner-operated. No agent upload, deployment,
production mutation, push or external communication occurred. The runbooks now consolidate the fresh-host SSM path and resolved setup
traps; the probe uses verified current RDS metadata for new DB endpoints. Fresh
cold-start/full replacement remains untested. Additional scenario loading is
deferred until after this documentation/staging handoff. Review follow-up adds
owner-file cleanup, grants without password reset, host maintenance/reboot and
Caddy update procedures, and fixture regeneration after schema changes. These
source changes have not been installed on the current host. The SSM advanced-tier
cost concern was checked: account setting is `standard`; AWS removed that tier
in June 2026 and now charges per hybrid session/command.

Common preparation includes explicit container inputs/context exclusions,
verified database CA/hostname checks, dependency updates and reconnect handling.
Local evidence includes 144 Backend tests, 26 UI tests, lint, secret scan, clean
builds, Compose/Caddy polling/WebSocket workflows, real-driver TLS rejection
checks, reconnect recovery and a short twelve-client check. Subsequent operator
helpers pass 50 offline tests and synthetic probe checks. These local checks do
not replace hosted game/load/recovery acceptance.

Expected usage is usually one active game and at most twelve devices. Recurring
noticeable reconnects during normal games are unacceptable; measure recovery
separately from planned maintenance. Production adoption, cutover and EB cleanup
require separate reviews and approvals. ECS/Fargate remains a possible future
scaling option, with no change to this trial. Frontend React/CRA modernization
remains separate backlog work.

Companion local branches: `codex/lightsail-deployment` in Backend and UI; no
pushes or pull requests. Remote refs were refreshed: Backend is 18 commits ahead
of `origin/main`; UI is 16 ahead and 8 behind, before these staged changes.
There is no off-device Git branch copy yet; the existing device backup is not a
verified Git recovery test. Private operator state/artifacts live outside source
checkouts and use the owner's existing FileVault/device backup arrangement;
backup encryption/restore access remain to verify. Public website claims and
facilitation resources are unchanged; reassess before production cutover.

### Complete remaining Backend dependency-audit disposition

**Type:** Security / dependencies

**Status:** Production-dependency findings resolved in the trial release; working
production EB is unchanged. Remaining development-tool disposition stays tracked.

**Next actor:** Operator to refresh the audit for the next reviewed release and
production preparation; historical counts are not current audit evidence.

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
