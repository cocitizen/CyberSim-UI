# Manual Testing — Injection Budget Change

## Overview

This document covers manual test cases for the `injection-budget-change` feature. The feature adds a `budget_change` field to injection events, mirroring the existing `poll_change` field. When an injection is delivered, it can now reduce or increase the game budget. The budget impact is displayed in the injection card and in the EVENT LOGS view. Prevented injections do not apply the budget change.

**Seed version:** `cso@2026-03-19.1`
**Related implementation notes:** `docs/features/injection-budget-change.md` (Backend)

---

## Test Data

Six injections in this seed have `budget_change` set to a non-null value. All six serve as test subjects.

> **How to find injections in the UI:** Each injection card shows its asset code in parentheses in the title, e.g. _"Strategy leaked (1022)"_. Use the asset code to locate the correct card quickly.

| Injection ID      | Injection Title                              | Asset Code | `budget_change` | `poll_change` | Location     |
| ----------------- | -------------------------------------------- | ---------- | --------------- | ------------- | ------------ |
| rec4O6rmlQn51TfbA | Strategy leaked                              | **1022**   | -$500           | -3%           | CAMPAIGN HQ  |
| rec9WtN8StuxHPMY7 | Email server hacked                          | **1035**   | -$1,000         | -3%           | CAMPAIGN HQ  |
| rechW2QnG1DxlEEgZ | Ransomware attack disables GN computers      | **1055**   | -$2,000         | null          | LOCAL BRANCH |
| recth3Hpy9yYNHH6P | Malware corrupts critical information        | **1021**   | -$750           | null          | LOCAL BRANCH |
| recfguim0DKPvSpmJ | Phone call from an MP                        | **1003**   | +$750           | null          | CAMPAIGN HQ  |
| recH31GX4bCTQmswf | Real update notification for operating system | **1013**  | +$300           | null          | CAMPAIGN HQ  |

---

## Setup

1. Start both servers:

   ```bash
   # Backend (default port 3001)
   cd CyberSim-Backend && npm run dev

   # Frontend (default port 3000)
   cd CyberSim-UI && npm start
   ```

2. Open `http://localhost:3000` and create a new game using scenario `cso@2026-03-19.1`.
3. Note the starting budget displayed in the **BPT** bar at the top of the screen (typically **$30,000**).
4. Click **SAVE Items and START Simulation**.

---

## Test Cases

### TC-1 — Budget field visible on injection card with budget_change

**Scope:** CAMPAIGN HQ tab — injection **1022** _"Strategy leaked"_ (`budget_change: -500`)

**Steps:**

1. In the simulation, navigate to the **CAMPAIGN HQ** tab.
2. Deliver injection **1022** — _"Strategy leaked"_.
3. Expand the injection accordion.

**Expected result:**

- A **Budget** field appears in the injection metadata row alongside **Poll**, **Systems disabled**, and **Avoided**
- The displayed value is **-$500**
- The **Poll** field shows **-3%** (existing behaviour, regression check)
- The **Avoided** field shows **NO**

**Failure indicators:**

- No Budget field appears
- Budget field shows `$?` or `$0`

---

### TC-2 — Budget is clamped at $0 when injection would push it below zero

**Scope:** BPT bar — injection **1022** delivered from a $0 starting balance

**Steps:**

1. Confirm the starting budget in the BPT bar is **$0** (simulation starts at zero).
2. Deliver injection **1022** — _"Strategy leaked"_ (`budget_change: -500`).

**Expected result:**

- The BPT bar budget remains at **$0** — the floor prevents it going negative
- The change is applied in real time without a page refresh

**Failure indicators:**

- Budget displays **-$500** instead of being clamped to **$0**

---

### TC-3 — Budget field shows "(avoided)" when injection is prevented

**Scope:** CAMPAIGN HQ tab — injection **1022** prevented via its `skipper_mitigation`

> **Note:** Check `injection.json` for `skipper_mitigation` on injection **1022**. If none is set, use injection **1055** which can be tested via the skipper role. Alternatively, skip to TC-4 which verifies prevented state via the Avoided flag.

**Steps:**

1. Before delivering injection **1022**, purchase the skipper mitigation for that injection (if applicable) or trigger prevention through the facilitator panel.
2. Expand the injection accordion after the injection is marked as prevented.

**Expected result:**

- The **Budget** field shows **-$500 (avoided)**
- The **Avoided** field shows **YES**
- The BPT bar budget is **not reduced** (prevention blocks the budget change)

**Failure indicators:**

- Budget decreases despite injection being prevented
- `(avoided)` text is missing from the Budget field

---

### TC-4 — Injection with budget_change but no poll_change displays correctly

**Scope:** LOCAL BRANCH tab — injection **1055** _"Ransomware attack disables GN computers"_ (`budget_change: -2000`, `poll_change: null`)

**Steps:**

1. Navigate to the **LOCAL BRANCH** tab.
2. Deliver injection **1055** — _"Ransomware attack disables GN computers"_.
3. Expand the injection accordion.

**Expected result:**

- **Budget** field is visible and shows **-$2,000**
- **Poll** field shows **-** (dash, because `poll_change` is null — existing behaviour)
- BPT bar budget is clamped at **$0** — it does not go to **-$2,000**

**Failure indicators:**

- Budget field absent when poll_change is null
- Poll field shows a value when it should be a dash
- BPT bar shows a negative value instead of **$0**

---

### TC-5 — Injection with no budget_change shows no Budget field

**Scope:** Any injection where `budget_change` is null

**Suggested injection:** Any injection not in the test data table above (e.g. injection **1001** _"Amazon databreach"_ or **1007** _"Cleaner quits"_)

**Steps:**

1. Deliver any injection that does not appear in the test data table.
2. Expand the injection accordion.

**Expected result:**

- No **Budget** field appears in the metadata row
- All other fields (**Poll**, **Systems disabled**, **Avoided**) appear exactly as before

**Purpose:** Regression check — the feature must not add a spurious Budget field to injections without a budget impact.

---

### TC-6 — Multiple negative injections all clamp at $0

**Scope:** Cumulative budget changes from a $0 starting balance

**Steps:**

1. Confirm the starting budget in the BPT bar is **$0**.
2. Deliver injection **1022** (`budget_change: -500`). Confirm budget is **$0** (clamped).
3. Deliver injection **1035** (`budget_change: -1,000`). Confirm budget is **$0** (clamped).
4. Deliver injection **1021** (`budget_change: -750`). Confirm budget is **$0** (clamped).

**Expected result:**

- Budget remains at **$0** after every delivery — the floor is enforced at each step

**Failure indicators:**

- Budget drops below **$0** at any point
- A later delivery shows an unexpected negative value

---

### TC-7 — Budget change visible in EVENT LOGS tab

**Scope:** EVENT LOGS tab — injection **1022** already delivered

**Precondition:** Injection **1022** has been delivered.

**Steps:**

1. Navigate to the **EVENT LOGS** tab.
2. Find the "Threat Injected" entry for injection **1022** (_"Strategy leaked"_) and expand it.

**Expected result:**

- The expanded log entry shows the same injection body as the simulation tab, including the **Budget: -$500** field
- The log entry is read-only (no RESOLVE EVENT button)

**Failure indicators:**

- Budget field absent from the log entry even though it appears on the simulation card

---

### TC-8 — Positive budget_change increases game budget

**Scope:** CAMPAIGN HQ tab — injection **1003** _"Phone call from an MP"_ (`budget_change: +750`)

**Steps:**

1. Note the current budget in the BPT bar (e.g. **$30,000**).
2. Navigate to the **CAMPAIGN HQ** tab.
3. Deliver injection **1003** — _"Phone call from an MP"_.
4. Expand the injection accordion.

**Expected result:**

- A **Budget** field appears and shows **$750** (no `+` prefix — known caveat, see implementation notes)
- The BPT bar budget immediately updates to **previous budget + $750** (e.g. **$30,750**)
- The **Poll** field shows **-** (null `poll_change`)
- The **Avoided** field shows **NO**

**Failure indicators:**

- Budget decreases instead of increases
- Budget field is absent
- BPT bar does not update

---

### TC-9 — Positive and negative budget_change stack correctly in sequence

**Scope:** Cumulative budget across mixed-sign deliveries

**Steps:**

1. Note the starting budget (e.g. **$30,000**).
2. Deliver injection **1003** (`budget_change: +750`). Confirm budget is **$30,750**.
3. Deliver injection **1022** (`budget_change: -500`). Confirm budget is **$30,250**.
4. Deliver injection **1013** (`budget_change: +300`). Confirm budget is **$30,550**.

**Expected result:**

- Net change after all three is **+$550**; budget matches **starting + $550**
- Each BPT update is immediate and reflects only that delivery's delta

**Failure indicators:**

- Budget ends at an unexpected value
- A positive delivery appears to deduct instead of add

---

### TC-10 — Budget cannot go below zero

**Scope:** Budget floor at $0

**Steps:**

1. Start a new game.
2. Build up a modest positive balance by delivering injections **1003** (`+$750`) and **1013** (`+$300`), giving a budget of **$1,050**.
3. Deliver injection **1055** (`budget_change: -2,000`).

**Expected result:**

- The BPT bar budget is floored at **$0**, not shown as a negative value (e.g. **-$950**)

**Failure indicators:**

- Budget displays a negative value instead of being clamped to **$0**

---

## Known UI Caveats

These are not test failures — they are documented limitations of the current implementation:

- **No `+` prefix on positive values** — a positive `budget_change` (e.g. `+$750`) renders as `$750` without a leading `+`. This is consistent with how `poll_change` is displayed and is tracked for a future polish pass.
- **No colour differentiation** — positive and negative budget changes render in the same default text colour. Red/green colouring is deferred.

---

## Pass Criteria

| Test Case | Description                                                                                    | Priority |
| --------- | ---------------------------------------------------------------------------------------------- | -------- |
| TC-1      | Budget field visible on injection card when `budget_change` is non-null                        | Critical |
| TC-2      | Game budget clamped at $0 when negative injection delivered from zero balance                   | Critical |
| TC-3      | Prevented injection shows "(avoided)" and does not deduct from budget                          | High     |
| TC-4      | Injection with budget_change but no poll_change renders both fields correctly                   | High     |
| TC-5      | Injections without budget_change show no Budget field (regression)                             | Critical |
| TC-6      | Multiple negative deliveries all clamp at $0 (floor enforced at each step)                     | High     |
| TC-7      | Budget field visible in EVENT LOGS read-only view                                               | Medium   |
| TC-8      | Positive budget_change increases game budget correctly                                          | High     |
| TC-9      | Mixed positive and negative deliveries stack to correct net total                               | High     |
| TC-10     | Budget is clamped at $0 when injections exceed available funds (floor enforced)                 | Medium   |
