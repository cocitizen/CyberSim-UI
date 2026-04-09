# Injection Budget Change

## Feature Request

Add a `budget_change` field to injection events, mirroring the existing `poll_change` field. When an injection is delivered it can now reduce or increase the game budget in addition to (or instead of) affecting the poll percentage. The `curveball` table already supported both fields; this feature brings budget-impact parity to injections.

Previously, delivering an injection could only shift the campaign's poll percentage. Budget changes were limited to curveball events and campaign actions.

## What Was Modified

### 1. InjectionBody.jsx (UI Component)

**File**: `src/components/Simulation/Injections/InjectionBody.jsx`

- **Added `numberToUsd` to the `util` import** — provides consistent currency formatting matching `BPT.jsx` and `CurveballEventLog.jsx`.
- **Added a Budget metadata column** — rendered conditionally when `injection.budget_change != null`. It sits in the same metadata row as Poll, Systems disabled, and Avoided.
  - Displays the value formatted as USD (e.g. `-$500`, `-$2,000`).
  - Inherits the `text-disabled` class when the injection was prevented, keeping styling consistent with the Poll and Systems columns.
  - Appends `(avoided)` when the injection is prevented, indicating that the budget hit did not apply.
- **No change to the EventLogs view** — `EventLogSwitch.jsx` already passes the full injection object into `<InjectionBody>`, so the Budget field appears there automatically at no extra cost.

## How It Affects the Codebase

- **Backend migration required** — a `budget_change` decimal column was added to the `injection` table via `migrations/20260401000000_add_budget_change_to_injection.js`.
- **Backend delivery logic updated** — `deliverGameInjection` in `src/models/game.js` now reads `budget_change` from the injection row and applies `budget = Math.max(0, budget + budgetChange)` to the game record when non-null, flooring at zero to match curveball convention.
- **Seed data updated** — all `injection.json` seed files now include a `budget_change` field (null for no-ops). In the `cso@2026-03-19.1` scenario, six injections carry concrete values: **1022** (−$500), **1035** (−$1,000), **1021** (−$750), **1055** (−$2,000), **1003** (+$750), and **1013** (+$300).
- **No breaking changes** — injections without a `budget_change` value (null) render exactly as before. The Budget column only appears when a non-null value is present.
- **Prevented injections** — the existing prevention path in the backend is unchanged; `deliverGameInjection` is not called for prevented injections, so no budget deduction occurs.

## Caveats

### Positive `budget_change` is supported but not polished

The backend formula `Math.max(0, budget + budgetChange)` and the `numberToUsd()` display both work correctly for positive values — no additional code is required to support them. Two injections in the `cso@2026-03-19.1` seed (**1003** and **1013**) demonstrate this.

However, the current UI has two rough edges when `budget_change` is positive that are **known but not yet addressed**:

1. **No `+` sign prefix** — `numberToUsd(750)` renders as `$750`, not `+$750`. Without a leading `+`, a positive budget figure is visually ambiguous against a neutral `$0` baseline. The `poll_change` column has the same issue (`3%` instead of `+3%`) and was left unchanged to stay consistent.

2. **No colour differentiation** — negative budget changes could logically render in red (`text-danger`) and positive ones in green (`text-success`). This was intentionally deferred to avoid introducing sign-aware colour logic while the feature is new. `CurveballEventLog.jsx` does not colour-code its `budget_change` either, so this would be a divergence from the existing pattern.

3. **"(avoided)" copy on positive injections** — if a beneficial injection (positive `budget_change`) is ever paired with a `skipper_mitigation` and prevented, the display would read e.g. `$750 (avoided)`, which is semantically awkward. This is an edge case that does not arise with current seed data but should be considered if such injections are authored in future.

These three issues are tracked and can be resolved together in a follow-up UI polish pass when positive-budget injections become a first-class part of the scenario design.
