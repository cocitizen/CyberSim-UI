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

### Brand fonts fail to load on the Amplify-hosted UI

**Type:** Bug / deployment  
**Source:** Game-name error investigation (2026-11-13)  
**Priority:** Medium  
**Effort:** Small  
**Status:** Backlog  

On `city.cybersim.app`, all three self-hosted `.woff2` font files return the app's `index.html` (HTTP 200, `text/html`), so every browser falls back to system fonts. The SPA rewrite rule in [aws-amplify-deployment.md](aws-amplify-deployment.md) excludes `woff` but not `woff2` from the rewrite. Fix: add `woff2` to the rule in the Amplify console and in that doc, then confirm a font URL returns `font/woff2`. Check other Amplify-hosted scenario subdomains too.

### Remaining form fields that flag errors without a visible message

**Type:** UX / accessibility  
**Source:** Game-name error investigation (2026-11-13)  
**Priority:** Low  
**Effort:** Small  
**Status:** Backlog  

The game-name field now renders its own error message, because Bootstrap's `Form.Control.Feedback` (revealed by a sibling CSS selector) collapsed to zero height in Safari. Two similar spots remain:

- `EnterGame.jsx`: the starting budget and starting support fields turn red when empty or 0 but never show a message, and the form doesn't block submission for them.
- `ScenarioImport.jsx` (admin): the scenario select still uses `Form.Control.Feedback` and may hide its error in Safari.

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

### Add Terraform documentation

Document the Terraform-managed backend environment, what it creates, what it reuses, and how to safely destroy/recreate the test environment.

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

### Define core game settings per scenario

**Type:** Gameplay / enhancement  
**Source:** Brand-reskin projector work (2026-06); projector fixes (2026-11)  
**Priority:** Medium  
**Effort:** Medium  
**Status:** Planned  
**Plan:** [Scenario-defined game settings](plans/scenario-game-settings.md)  
**Decision:** [D-004](decisions.md#d-004--scenarios-define-core-game-settings)

`Projector.jsx` currently hardcodes `SUPPORT_WIN_THRESHOLD = 60` and `GAME_LENGTH_MS` (60 minutes; the countdown extends only if a scenario schedules events later than that). The `scenario` table has neither field, so every scenario shares the same stub values regardless of its actual design. Starting budget and starting support are already per-game options on the game-creation form, but their defaults are hardcoded in both the UI and the Backend rather than coming from the scenario.

Per D-004, the scenario will define all four values. The plan has the cross-repository steps, acceptance checks, and open questions. The next action is deciding where designers enter the values.

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

### Example completed item

**Type:** Docs  
**Completed:** YYYY-MM-DD  

Brief note about what was done.
