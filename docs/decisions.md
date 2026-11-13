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

### D-004 — Scenarios define core game settings

**Status:** Accepted (2026-11-13); implementation planned  
**Affected repositories:** CyberSim-Backend, CyberSim-UI

**Context:** Game length, the support level needed to win, starting budget, and starting support are hardcoded in the UI and Backend. All four are calibrated against a scenario's design: event timings assume a game length, and whether a win threshold is reachable depends on starting support and how much the events move it. A scenario designed around different values would still get the hardcoded ones.

**Decision:** Each scenario defines all four values. The game-creation form pre-fills starting budget and starting support from the scenario and lets facilitators change them for an individual game. Game length cannot be changed per game, because events fire at fixed times. The win threshold also comes only from the scenario unless a need for per-game changes appears.

**Consequences:** Hardcoded values are temporary stubs with defaults that preserve current behavior. Scenario import, saved scenario revisions, and the scenario API must carry the settings. How designers enter them is still open. See the [scenario-defined game settings plan](plans/scenario-game-settings.md).

## Open questions

### Should static data fetching follow the active game's scenario, not the ambient slug?

**Why it matters:** The frontend resolves two different scenario slugs that nothing currently reconciles: the *ambient* slug used to fetch static reference data (from hostname or `REACT_APP_SCENARIO_SLUG`), and the scenario an *active game* is actually bound to (stored on the game row). When these drift — e.g., a stale env value after a scenario change without an app restart — the UI fetches static data for the wrong scenario while rendering a game bound to a different one, producing dangling ids (systems/roles/`required_systems` resolve to nothing). This was the confirmed root cause of the reskin-era "mismatch" errors.

**Current state:** Mitigated, not resolved. Null-safety guards in the action components (fail visibly rather than silently) and a slug-match regression test are in place; the underlying design gap remains.

**What's needed to resolve it:** A decision on whether `StaticDataProvider` should source static data by the active game's `scenario_id` instead of the ambient slug, and what that changes for screens with no active game yet (e.g., scenario selection before a game exists).
