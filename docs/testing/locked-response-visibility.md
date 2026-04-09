# Manual Testing — Locked Response Visibility

## Overview

This document covers manual test cases for the locked-response-visibility feature. The feature makes injection responses that require an unpurchased mitigation visible in the event widget as greyed out and unselectable, rather than hiding them entirely. This gives the facilitator a visual cue that a specific mitigation purchase would unlock an additional response option for the player.

**Seed version:** `cso@2026-03-19.1`
**Related implementation notes:** `docs/features/implementation/locked-response-visibility.md`

---

## Test Data

Four responses in this seed have `required_mitigation` set. All four serve as test subjects.

> **How to find injections in the UI:** Each injection card shows its asset code in parentheses in the title, e.g. _"Grassroots Network organizer's phone stolen (1016)"_. Use the asset code to locate the correct card quickly.
>
> **How to find mitigations in the UI:** Open the **ACTION TABLE** tab and search or scroll by the mitigation description text shown below.
>
> **How to find responses in the UI:** Expand the injection accordion — responses are listed by their description text.

| Response ID       | Response Description                | Required Mitigation ID | Required Mitigation Description                                                            | Injection ID      | Injection Title                                 | Asset Code | Tab          |
| ----------------- | ----------------------------------- | ---------------------- | ------------------------------------------------------------------------------------------ | ----------------- | ----------------------------------------------- | ---------- | ------------ |
| recgBa7yXhB6iYeh9 | Rodrigo Wintz' phone remotely wiped | recp4bX6SgSQcJtzU      | Set up and monitor a remote device management system on all staff/volunteer mobile devices | recRJh7cpEgDrAbQ0 | Grassroots Network organizer's phone stolen     | **1016**   | LOCAL BRANCH |
| recP58NIM7Ez2swSb | Restore supporter files from backup | recNg1ZHVUN0wrJg8      | Establish secure backup solutions for all staff and volunteer devices and data             | recth3Hpy9yYNHH6P | Malware corrupts critical information           | **1021**   | LOCAL BRANCH |
| recP58NIM7Ez2swSb | Restore supporter files from backup | recNg1ZHVUN0wrJg8      | Establish secure backup solutions for all staff and volunteer devices and data             | rechW2QnG1DxlEEgZ | Ransomware attack disables GN computers         | **1055**   | LOCAL BRANCH |
| recTdnubRgXFq4f5X | Access CMS backup                   | rect7BZ1qu3rICIfg      | Create a secure backup for the online contact management system                            | recHhJpOvsfUi3x7L | Contact management system deleted suddenly      | **1048**   | CAMPAIGN HQ  |
| recuQGP1QAP6j5UHU | Use already purchased trusted VPN   | recp18ihMDxceH8kN      | Implement a trusted virtual private network (VPN) for all staff and volunteers             | recaV5aL9GR8xYZdD | Access to Facebook blocked in area around Vario | **1006**   | LOCAL BRANCH |

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
3. On the **Preparation** screen, **do not purchase** any of the four gating mitigations:
   - `recp4bX6SgSQcJtzU` — "Set up and monitor a remote device management system..." ($1,500)
   - `recNg1ZHVUN0wrJg8` — "Establish secure backup solutions for all staff and volunteer devices..." ($1,500)
   - `rect7BZ1qu3rICIfg` — "Create a secure backup for the online contact management system" ($1,500)
   - `recp18ihMDxceH8kN` — "Implement a trusted virtual private network (VPN) for all staff and volunteers" ($1,000)
4. Other mitigations may be purchased freely.
5. Click **SAVE Items and START Simulation**.

---

## Test Cases

### TC-1 — Locked response appears greyed out (LOCAL BRANCH / MDM gate)

**Scope:** LOCAL BRANCH tab — injection **1016** _"Grassroots Network organizer's phone stolen"_, response _"Rodrigo Wintz' phone remotely wiped"_ (requires MDM mitigation `recp4bX6SgSQcJtzU`, not purchased)

**Steps:**

1. In the simulation, navigate to the **LOCAL BRANCH** tab.
2. Deliver injection **1016** — _"Grassroots Network organizer's phone stolen"_.
3. Expand the injection accordion.

**Expected result:**

- _"Rodrigo Wintz' phone remotely wiped"_ is visible in the response list
- The row is rendered at reduced opacity (greyed out)
- A lock icon appears to the left of the response description
- A hint reads: `— Requires: Set up and monitor a remote device management system on all staff/volunteer mobile devices`
- The toggle switch is disabled and cannot be turned on
- The main cost label shows `Cost: $0` (the response's own cost — no additional charge once the mitigation is purchased)
- The hint text also includes the mitigation's purchase cost in parentheses (e.g. `(Cost: $1500)`)

**Failure indicators:**

- Response is completely absent from the list (old behaviour — regression)
- Response appears fully enabled with no lock indicator
- Hint text is missing or does not show the mitigation's purchase cost

---

### TC-2 — Locked response unlocks reactively after mitigation purchase (MDM gate)

**Scope:** LOCAL BRANCH tab — injection **1016**, response _"Rodrigo Wintz' phone remotely wiped"_ — MDM mitigation `recp4bX6SgSQcJtzU` purchased mid-game

**Precondition:** TC-1 passes (response is visible and locked).

**Steps:**

1. With injection **1016** expanded and the response locked, navigate to the **ACTION TABLE** tab.
2. Purchase mitigation `recp4bX6SgSQcJtzU` — _"Set up and monitor a remote device management system on all staff/volunteer mobile devices"_.
3. Navigate back to the **LOCAL BRANCH** tab and re-expand injection **1016**.

**Expected result:**

- _"Rodrigo Wintz' phone remotely wiped"_ now appears at full opacity
- No lock icon, no "Requires:" hint text
- Toggle switch is enabled and can be selected
- The cost label now shows `Cost: $0` — the mitigation purchase already covers this response
- Selecting it and clicking **RESOLVE EVENT** completes without error

**Failure indicators:**

- Lock remains after mitigation is purchased
- Response still cannot be toggled
- Cost label still shows a non-zero amount after the mitigation is purchased

---

### TC-3 — CAMPAIGN HQ locked response (CMS backup gate)

**Scope:** CAMPAIGN HQ tab — injection **1048** _"Contact management system deleted suddenly"_, response _"Access CMS backup"_ (requires `rect7BZ1qu3rICIfg`, not purchased)

**Steps (lock check):**

1. Navigate to the **CAMPAIGN HQ** tab.
2. Deliver injection **1048** — _"Contact management system deleted suddenly"_.
3. Expand the injection accordion.

**Expected result:**

- _"Access CMS backup"_ is visible but locked (greyed out, lock icon, hint: `— Requires: Create a secure backup for the online contact management system`)
- Toggle switch is disabled
- The main cost label shows `Cost: $0`; the hint also includes the mitigation's purchase cost in parentheses

**Steps (unlock):**

1. Navigate to the **ACTION TABLE** tab and purchase `rect7BZ1qu3rICIfg` — _"Create a secure backup for the online contact management system"_.
2. Return to **CAMPAIGN HQ**, re-expand injection **1048**.

**Expected result:**

- _"Access CMS backup"_ is now fully enabled and selectable
- The cost label now shows `Cost: $0`

---

### TC-4 — LOCAL BRANCH locked response — backup gate (injections 1021 and 1055)

**Scope:** LOCAL BRANCH tab — response _"Restore supporter files from backup"_ (requires `recNg1ZHVUN0wrJg8`, not purchased). This response appears in two separate injections; both should gate it.

**Steps — injection 1021:**

1. Navigate to the **LOCAL BRANCH** tab.
2. Deliver injection **1021** — _"Malware corrupts critical information"_.
3. Expand the injection accordion.
4. Confirm _"Restore supporter files from backup"_ is greyed out with lock icon, hint: `— Requires: Establish secure backup solutions for all staff and volunteer devices and data`, main cost shows `Cost: $0`, and the hint includes the mitigation's purchase cost in parentheses.

**Steps — injection 1055:**

1. Deliver injection **1055** — _"Ransomware attack disables GN computers"_.
2. Expand the accordion and confirm the same locked treatment (main cost `$0`, hint includes mitigation purchase cost).

**Steps (unlock, verify both):**

1. Navigate to the **ACTION TABLE** tab and purchase `recNg1ZHVUN0wrJg8` — _"Establish secure backup solutions for all staff and volunteer devices and data"_.
2. Return to each expanded injection in turn.

**Expected result:**

- In both injection **1021** and **1055**, _"Restore supporter files from backup"_ transitions to fully enabled after the single mitigation purchase.
- The cost label in both injections now shows `Cost: $0`.

---

### TC-5 — LOCAL BRANCH locked response — VPN gate (injection 1006)

**Scope:** LOCAL BRANCH tab — injection **1006** _"Access to Facebook blocked in area around Vario"_, response _"Use already purchased trusted VPN"_ (requires `recp18ihMDxceH8kN`, not purchased)

**Steps (lock check):**

1. Navigate to the **LOCAL BRANCH** tab.
2. Deliver injection **1006** — _"Access to Facebook blocked in area around Vario"_.
3. Expand the injection accordion.

**Expected result:**

- _"Use already purchased trusted VPN"_ is visible but locked (greyed out, lock icon, hint: `— Requires: Implement a trusted virtual private network (VPN) for all staff and volunteers`)
- The main cost label shows `Cost: $0`; the hint also includes the mitigation's purchase cost in parentheses
- The other two VPN responses (_"Use a free VPN..."_ and _"Use a trusted VPN to circumvent blocking..."_) remain fully visible and enabled — they have no `required_mitigation`

**Steps (unlock):**

1. Purchase `recp18ihMDxceH8kN` — _"Implement a trusted virtual private network (VPN) for all staff and volunteers"_ from the **ACTION TABLE**.
2. Re-expand injection **1006**.

**Expected result:**

- _"Use already purchased trusted VPN"_ is now fully enabled and selectable
- The cost label now shows `Cost: $0`

---

### TC-6 — Responses without `required_mitigation` are unaffected

**Scope:** Any injection with responses that have no `required_mitigation` set

**Suggested injection:** **1001** _"Amazon databreach"_ → response _"Change passwords"_ (no mitigation gate)
or **1007** _"Cleaner quits"_ → response _"Change office lock at OFD"_ (no mitigation gate)

**Steps:**

1. Deliver any injection from the suggestions above.
2. Expand the injection accordion.

**Expected result:**

- All non-gated responses appear and behave exactly as before
- No lock icon, no hint text, no opacity change
- Toggle switches are fully functional

**Purpose:** Regression check to confirm the change does not affect the common case.

---

### TC-7 — Locked response visible in EVENT LOGS tab

**Scope:** EVENT LOGS tab, injection **1016** already delivered, MDM mitigation `recp4bX6SgSQcJtzU` still not purchased

**Precondition:** Injection **1016** has been delivered and the MDM mitigation is not purchased.

**Steps:**

1. Navigate to the **EVENT LOGS** tab.
2. Find the "Threat Injected" entry for injection **1016** (_"Grassroots Network organizer's phone stolen"_) and expand it.

**Expected result:**

- _"Rodrigo Wintz' phone remotely wiped"_ is visible with the same greyed-out lock treatment as in LOCAL BRANCH
- No RESOLVE EVENT button is present (this view is read-only for the facilitator)
- The lock indicator is present as informational context

---

### TC-8 — Locked response cannot be submitted via the backend

**Scope:** Backend validation, defensive check

> This test requires manually firing a socket event via browser devtools, bypassing the disabled UI control. It is only needed for security/robustness validation and is not required for routine feature testing.

**Steps:**

1. Open browser devtools and locate the active socket connection.
2. Emit a `RESPONDTOINJECTION` event using response ID `recgBa7yXhB6iYeh9` (_"Rodrigo Wintz' phone remotely wiped"_) while MDM mitigation `recp4bX6SgSQcJtzU` is not purchased.

**Expected result:**

- The backend rejects the submission with `ERR_RESPONSE_NOT_ALLOWED`
- The game state is not modified

**Note:** Backend validation in `game.js:makeResponses()` is independent of the frontend change and remains in place regardless of UI state.

---

## Pass Criteria

| Test Case | Description                                                                                         | Priority |
| --------- | --------------------------------------------------------------------------------------------------- | -------- |
| TC-1      | MDM-gated response visible and greyed out (injection 1016)                                          | Critical |
| TC-2      | MDM-gated response unlocks reactively after mitigation purchase                                     | Critical |
| TC-3      | HQ CMS-backup-gated response follows same behaviour (injection 1048)                                | High     |
| TC-4      | Backup-gated response locked in both injections 1021 and 1055; one mitigation purchase unlocks both | High     |
| TC-5      | VPN-gated response locked in injection 1006; other VPN responses unaffected                         | High     |
| TC-6      | Non-gated responses unaffected (regression)                                                         | Critical |
| TC-7      | Lock visible in EVENT LOGS read-only view                                                           | Medium   |
| TC-8      | Backend rejects bypass attempt                                                                      | Low      |
