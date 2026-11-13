# Scenario-defined game settings

**Status:** Planned (not started)  
**Owner:** Unassigned  
**Affected repositories:** CyberSim-Backend, CyberSim-UI; each scenario's Airtable base  
**Decision:** [D-004](../decisions.md#d-004--scenarios-define-core-game-settings)  
**Backlog:** [Define core game settings per scenario](../cybersim-backlog.md#define-core-game-settings-per-scenario)

**Next action:** Resolve open question 1 (where designers enter the values), then start the Backend work.

## Goal

Each scenario defines four core game settings instead of the code hardcoding them:

| Setting | Current source | Per-game override? |
| --- | --- | --- |
| Game length | UI stub: `GAME_LENGTH_MS` (60 min) in `Projector.jsx`, extended to the last event's `trigger_time` | No. Events fire at fixed times, so a different length would skip events or leave empty time. |
| Win support threshold | UI stub: `SUPPORT_WIN_THRESHOLD` (60%) in `Projector.jsx` | No, for now |
| Starting budget | Hardcoded $6,000 default in `EnterGame.jsx` and Backend `createGame` | Yes, already on the game-creation form |
| Starting support | Hardcoded default in `EnterGame.jsx`; 55% in Backend `createGame` | Yes, already on the game-creation form |

The scenario supplies the values. The game-creation form pre-fills budget and support from them, and the facilitator can still change both.

## Current state (verified 2026-11-13)

- The `scenario` table has `slug`, `name`, `description`, `is_active`, `revision` and timestamps. It has no game-settings columns.
- Every Airtable table holds scenario content (events, systems, mitigations, etc.). No table holds scenario-level settings. The Airtable import creates a new scenario row with `name` set to the slug.
- Saved scenario revisions (`CyberSim-Backend/seeds/scenarios/<slug>/<revision>/`) export content tables plus a `manifest.json`. Loading a revision upserts the scenario row from the manifest, and refuses a revision whose recorded latest migration differs from the database's.
- `GET /scenario` returns only `slug` and `name`.
- The win threshold appears to be display-only. No Backend logic decides a win. Confirm before implementation.

## Implementation steps

### CyberSim-Backend

1. Add a migration with four `scenario` columns, each non-null with defaults that preserve today's behavior: game length 60 minutes, win threshold 60%, starting budget 6000, starting support 55%.
2. Airtable import (`src/util/importScenarioFromAirtable.js`, `src/util/import_schemas.js`): read and validate the settings source (see open question 1) and write the values to the scenario row. Behavior when values are missing: see open question 3.
3. Saved revisions (`saveScenarioRevision.js`, `loadScenarioRevision.js`): include the settings when saving, and restore them when loading, so loading a revision does not reset them to the defaults.
4. Return the four settings from `GET /scenario`.
5. `createGame` (`src/models/game.js`): when the request omits budget or support, use the scenario's values instead of the hardcoded defaults.
6. Optionally warn during import when an event's trigger time is later than the scenario's game length.
7. Tests for the import, revision save/load round trip, `GET /scenario`, and the `createGame` fallbacks.
8. Re-save the existing revisions (`cso`, `tnr`, `city`, `lightsail`) under the new schema. The migration check would otherwise refuse to load them.
9. Docs: `docs/airtable-schema.md`, `docs/scenario-setup.md`, and designer guidance in `docs/airtable-handbook.md`.

### Airtable

10. Add the settings to each scenario's base (`cso`, `tnr`, `city`, and any others listed in `AIRTABLE_BASE_IDS`), then re-import. This depends on open question 1.

### CyberSim-UI

11. Expose the settings from `StaticDataProvider`.
12. `Projector.jsx`: replace `SUPPORT_WIN_THRESHOLD` and `GAME_LENGTH_MS` with the scenario values. Keep the current values as fallbacks for a Backend that doesn't return the settings yet.
13. `EnterGame.jsx`: pre-fill starting budget and support from the scenario, keeping them editable.
14. Tests for the projector and the game-creation defaults.

### Rollout order

Deploy the Backend first. Its column defaults keep current behavior, and the UI fallbacks let the UI ship before or after it. Then update the Airtable bases, re-import, and re-save revisions.

## Acceptance checks

- A scenario with no settings entered behaves exactly as today: 60:00 countdown, 60% win marker, $6,000 and 55% form defaults.
- Changing a scenario's settings in the chosen source and re-importing changes the projector countdown, the win marker and label, and the game-creation form defaults.
- Saving and reloading a scenario revision preserves its settings.
- A game created without budget or support values uses the scenario's values.
- Facilitators can still change starting budget and support for an individual game.
- Backend and UI test suites pass. Record the checks performed in each pull request.

## Open questions

1. **Where do designers enter the settings?** Recommended: a one-row "Scenario settings" table in each Airtable base, so the values live with the content designers already edit and come in on every import. Alternative: edit them on the admin dashboard and store them only in the database. That is less work but separates the values from the scenario design. The alternative also needs the import to leave existing values alone.
2. **Units in Airtable:** game length in minutes, converted on import, is the most designer-friendly option. Check how designers enter event trigger times today and stay consistent.
3. **Missing or invalid settings:** fall back to the defaults with an import warning (recommended while bases are being updated), or fail the import?
4. **Facilitation materials:** do any resources in `cybersim-resources` state a game length or win threshold that should follow the scenario?
