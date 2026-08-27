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

### D-003 — Keep NDI attribution as historical origin, not current affiliation

**Status:** Accepted  
**Affected repositories:** CyberSim-UI

**Context:** CyberSim originated as a National Democratic Institute (NDI) project; NDI branding is being deprecated project-wide. The UI README's "Origins" section is the only remaining reference.

**Decision:** Keep the NDI/NED/Microsoft origin note in the README's "Origins" section as historical attribution. Do not remove it, and do not let it imply CyberSim is a current NDI-branded or NDI-affiliated project.

**Consequences:** A future cleanup pass should not delete this line as a leftover NDI reference — it is deliberate. Any *new* NDI branding (visual assets, copy implying active affiliation, contact info) elsewhere should still be flagged and removed; only this specific historical mention is exempt.

## Open questions

### Should static data fetching follow the active game's scenario, not the ambient slug?

**Why it matters:** The frontend resolves two different scenario slugs that nothing currently reconciles: the *ambient* slug used to fetch static reference data (from hostname or `REACT_APP_SCENARIO_SLUG`), and the scenario an *active game* is actually bound to (stored on the game row). When these drift — e.g., a stale env value after a scenario change without an app restart — the UI fetches static data for the wrong scenario while rendering a game bound to a different one, producing dangling ids (systems/roles/`required_systems` resolve to nothing). This was the confirmed root cause of the reskin-era "mismatch" errors.

**Current state:** Mitigated, not resolved. Null-safety guards in the action components (fail visibly rather than silently) and a slug-match regression test are in place; the underlying design gap remains.

**What's needed to resolve it:** A decision on whether `StaticDataProvider` should source static data by the active game's `scenario_id` instead of the ambient slug, and what that changes for screens with no active game yet (e.g., scenario selection before a game exists).
