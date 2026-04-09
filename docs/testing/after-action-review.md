# Manual Testing — After Action Review

## Overview

This document covers manual test cases for the After Action Review (AAR) feature. The AAR page replaces the ASSESSMENT-state view with a purpose-built visual timeline of every injection event from a completed game, grouped into event chains showing the full consequence arc: initial threat → player response → follow-up event → post-event mitigation.

**Seed version:** `cso@2026-03-19.1`
**Related implementation notes:** `docs/features/implementation/after-action-review.md`

---

## Test Data

The following injections and responses are referenced across the test cases.

> **How to reach the AAR page:** Complete (or force-finish) a simulation. The ASSESSMENT state renders the AAR page automatically.  
> **Tip:** Use the **Admin** panel (`POST /admin/games/:id/finish`) or click **FINISH SIMULATION** in the facilitator UI to advance to ASSESSMENT without waiting for the timer.

### Injections with a follow-up event (event chains)

| Injection ID      | Asset Code | Title                                       | Follow-up ID      | Follow-up Title                         | Tab          |
| ----------------- | ---------- | ------------------------------------------- | ----------------- | --------------------------------------- | ------------ |
| reccCt7XY8uRuGMKb | **1000**   | Photo sharing on (infected) personal USB    | rechW2QnG1DxlEEgZ | Ransomware attack disables GN computers | LOCAL BRANCH |
| recw1zsFvRJd4pOu2 | **1005**   | Incoming email (Spearphishing)              | rec4O6rmlQn51TfbA | Strategy leaked                         | CAMPAIGN HQ  |
| recgVVHrq7Xq5Qt9r | **1011**   | Juran Knott leaves the party                | recHhJpOvsfUi3x7L | Contact management system deleted       | CAMPAIGN HQ  |
| recRJh7cpEgDrAbQ0 | **1016**   | Grassroots Network organizer's phone stolen | recWTfBD6BpH1RG8L | Phone stolen follow-up                  | LOCAL BRANCH |

### Injections that can be prevented by a budget item (skipper mitigation)

| Injection ID      | Asset Code | Title                                   | Skipper Mitigation ID | Skipper Mitigation Description                            |
| ----------------- | ---------- | --------------------------------------- | --------------------- | --------------------------------------------------------- |
| recw1zsFvRJd4pOu2 | **1005**   | Incoming email (Spearphishing)          | recwp0KlSovcOxIiI     | Implement two-factor authentication for Director          |
| rechW2QnG1DxlEEgZ | **1055**   | Ransomware attack disables GN computers | recPdPink0pRWfkWJ     | Purchase and monitor an advanced malware detection system |

### Key responses

| Response ID       | Description                         | Injection (parent) | Effect when submitted                           |
| ----------------- | ----------------------------------- | ------------------ | ----------------------------------------------- |
| recrsPq1oq92DWMB8 | Reformat computers                  | 1000               | Correct — marks 1055 follow-up as **prevented** |
| receeABdQkKIzz0pf | Clean malware off computers         | 1000               | Correct alternative for 1000                    |
| rechRUVEgvtP0rx76 | Pay ransomware                      | 1055 (follow-up)   | Post-event mitigation — triggers orange card    |
| recP58NIM7Ez2swSb | Restore supporter files from backup | 1055 (follow-up)   | Post-event mitigation — triggers orange card    |
| recmfVJNJiMJIwRvZ | Report phishing attempt             | 1005               | Correct for 1005                                |

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
3. Follow the per-test-case setup described in each TC below (some require specific mitigations purchased in the Preparation phase; some require injections to be delivered in a specific order).
4. Click **SAVE Items and START Simulation** (or use the socket helper in the automated suite).
5. Deliver any required injections, then click **FINISH SIMULATION** (or call `POST /admin/games/:id/finish`).
6. Verify the app transitions to the AAR page automatically.

---

## Test Cases

### TC-1 — AAR page loads in ASSESSMENT state

**Scope:** Page container — verifies the page renders with the game header and a non-empty timeline.

**Precondition:** Deliver at least one injection (e.g. **1022** _"Strategy leaked"_), then finish the game.

**Steps:**

1. Create a new game and start the simulation.
2. Deliver injection **1022** — _"Strategy leaked"_.
3. Click **FINISH SIMULATION** to advance to ASSESSMENT state.

**Expected result:**

- The page heading **After Action Review** is visible.
- The game ID and final budget/poll values appear beneath the heading.
- At least one event chain card is visible in the timeline (injection 1022 with a black header).
- No error alerts are shown.

**Failure indicators:**

- Page shows a spinner that never resolves.
- An error alert (_"Failed to load after action review."_) appears.
- The projector or old event-log view renders instead of the AAR page.

---

### TC-2 — Threat injected → BLACK card

**Scope:** A delivered injection with no follow-up event renders a black header card labelled `THREAT INJECTED`.

**Steps:**

1. Create a new game and start the simulation.
2. Deliver injection **1022** — _"Strategy leaked"_ (no follow-up injection in this seed).
3. Finish the simulation.

**Expected result:**

- The timeline contains a card for injection **1022**.
- The card header has a **black** background (`aar-header--injected` CSS class).
- The header label reads **THREAT INJECTED**.
- The card body shows the injection title and description.
- A **Key Takeaways** section is visible (bullet points).
- A **+ Expand** toggle button is visible in the footer.
- No response indicator or follow-up card is rendered below this card (no follow-up injection defined for 1022).

**Failure indicators:**

- Header is a colour other than black.
- Label text is incorrect (e.g. "EVENT PREVENTED" or "NOT REACHED").
- Card body is missing the title or description.

---

### TC-3 — Event prevented by budget-item purchase → BLUE card

**Scope:** A budget-item purchase made in the Preparation phase prevents the corresponding injection from being delivered. The AAR must render a blue card.

**Steps:**

1. Create a new game.
2. In the **Preparation** phase, purchase the skipper mitigation for injection **1005**:
   - Mitigation ID: `recwp0KlSovcOxIiI` — _"Implement two-factor authentication for Director"_.
3. Click **SAVE Items and START Simulation** (this marks injection **1005** as `prevented: true`).
4. Finish the simulation without delivering injection **1005**.

**Expected result:**

- The timeline contains a card for injection **1005** — _"Incoming email (Spearphishing)"_.
- The card header has a **blue** background (`aar-header--prevented`).
- The header label reads **EVENT PREVENTED thanks to... IMPLEMENT TWO-FACTOR AUTHENTICATION FOR DIRECTOR** (or similar mitigation description in uppercase).
- The follow-up injection **1022** — _"Strategy leaked"_ — does **not** appear as a separate top-level entry; it is entirely suppressed from the timeline (its parent was prevented, so the chain connector and follow-up card are omitted).

**Failure indicators:**

- Card renders with a black header instead of blue.
- Mitigation name is absent from the header label.
- The follow-up injection appears as a separate top-level black card.

---

### TC-4 — Correct response → GREEN follow-up avoided

**Scope:** A correct player response to injection **1000** causes the follow-up injection **1055** to be avoided. The AAR must render: black parent card → green connector → green follow-up card.

**Steps:**

1. Create a new game and start the simulation.
2. Deliver injection **1000** — _"Photo sharing on (infected) personal USB"_.
3. Resolve injection **1000** with a **correct** response:
   - Submit response `recrsPq1oq92DWMB8` — _"Reformat computers"_ (correct response for this injection).
4. Finish the simulation (follow-up **1055** should remain `prevented: true`).

**Expected result:**

- A top-level chain starts with a **black** parent card for injection **1000** (THREAT INJECTED).
- Below it, a **green** connector is shown with a ✓ (check circle) icon labelled **Correct response: REFORMAT COMPUTERS**.
- Below the connector, a **green** follow-up card for injection **1055** with header `EVENT AVOIDED` appears.
- The follow-up card body shows the title — _"Ransomware attack disables GN computers"_.
- If poll/budget damage values are defined for the avoided follow-up, an **AVOIDED DAMAGE** label appears in the header (right-aligned).
- Injection **1055** does **not** appear as a separate top-level entry in the timeline.

**Failure indicators:**

- Connector is red instead of green.
- Follow-up card header says `FOLLOW UP EVENT` (red) rather than `EVENT AVOIDED` (green).
- Parent and follow-up appear as two separate unconnected top-level entries.

---

### TC-5 — Incorrect/no response → RED follow-up delivered

**Scope:** An incorrect (or missing) player response to injection **1000** results in follow-up **1055** being delivered. The AAR must render: black parent card → red connector → red follow-up card.

**Steps:**

1. Create a new game and start the simulation.
2. Deliver injection **1000** — _"Photo sharing on (infected) personal USB"_.
3. Either:
   - Do **not** submit any response (leave the injection unresolved), **or**
   - Submit a non-correct response via `nonCorrectRespondToInjection`.
4. Deliver the follow-up injection **1055** — _"Ransomware attack disables GN computers"_.
5. Finish the simulation.

**Expected result:**

- A top-level chain starts with a **black** parent card for injection **1000** (THREAT INJECTED).
- Below it, a **red** connector with a ✗ (x-circle) icon labelled **Incorrect response: No response** (or the non-correct response description if one was submitted).
- Below the connector, a **red** follow-up card for injection **1055** with header `FOLLOW UP EVENT`.
- If **1055** has poll/budget impact values, they appear in the header (e.g. `POLLS: -2%`).
- No orange mitigation card is shown (no post-event response was submitted for **1055**).

**Failure indicators:**

- Connector is green instead of red.
- Follow-up card header says `EVENT AVOIDED` instead of `FOLLOW UP EVENT`.
- Injection **1055** appears as a separate top-level card rather than nested under **1000**.

---

### TC-6 — Post-event mitigation after follow-up → RED + ORANGE card

**Scope:** After the follow-up **1055** is delivered (wrong response to parent), the player submits a post-event mitigation response on **1055** (e.g. _"Pay ransomware"_). The AAR must render: black parent card → red connector → red follow-up card → green mitigation connector → orange mitigation card.

**Steps:**

1. Create a new game and start the simulation.
2. Deliver injection **1000** — _"Photo sharing on (infected) personal USB"_.
3. Submit a non-correct response to **1000** (or leave unresolved).
4. Deliver the follow-up injection **1055** — _"Ransomware attack disables GN computers"_.
5. Submit a post-event mitigation response to **1055**:
   - Response ID: `rechRUVEgvtP0rx76` — _"Pay ransomware"_ (cost: $1,500).
6. Finish the simulation.

**Expected result:**

- Parent card (**1000**): **black** header — THREAT INJECTED.
- Connector: **red** — Incorrect response: [name or "No response"].
- Follow-up card (**1055**): **red** header — FOLLOW UP EVENT.
- Below the follow-up card: a **green** mitigation connector with ✓ icon labelled **Mitigation: PAY RANSOMWARE**.
- Below the mitigation connector: an **orange** mitigation card with header `THREAT MITIGATION` and a cost label in the header (e.g. `- 1500 USD`).
- The orange card body displays the mitigation description or the response description.

**Failure indicators:**

- Orange card is absent even though a post-event response was submitted to the follow-up.
- Connector between the red and orange cards is missing or incorrectly styled.
- Orange card body is blank.

---

### TC-7 — Injection never triggered → GRAY card

**Scope:** An injection whose `trigger_time` is beyond the point at which the game was finished renders as a gray `NOT REACHED` card.

**Steps:**

1. Create a new game and start the simulation.
2. **Do not deliver** any injection with a late trigger time (e.g. injections scheduled past the 30-minute mark in the CSO scenario).
3. Immediately click **FINISH SIMULATION** after starting (while the timer is still near zero).

**Expected result:**

- At least one gray card is visible in the timeline for injections that never reached their trigger time.
- The gray card header (`aar-header--not-delivered`) reads **NOT REACHED**.
- The gray card body shows the injection title and description.
- No connector or follow-up card appears below a NOT REACHED parent card.

**Failure indicators:**

- No gray card rendered (all cards are black or blue when some injections were never delivered).
- A gray card incorrectly shows a response connector and follow-up.

---

### TC-8 — Expand / collapse parent card

**Scope:** Cards are collapsed by default; clicking **+ Expand** reveals the `AARExpandedDetails` section; clicking **− Collapse** hides it again.

**Precondition:** A game with at least one delivered injection (TC-2 setup is sufficient).

**Steps:**

1. Finish the game and open the AAR page.
2. Locate any **black** card (THREAT INJECTED).
3. Click the **+ Expand** button in the card footer.
4. Click the **− Collapse** button that appears.

**Expected result:**

- Default state: only the title, description, Key Takeaways, and **+ Expand** button are visible.
- After expanding: an **"Actions to prevent event"** section appears with all possible responses listed. Any response that was actually submitted shows **action taken** in green with a ✓.
- If a skipper mitigation exists for the injection: a **"Policy or tech to prevent worst impacts"** section appears showing the mitigation description. If purchased, it shows **✓ purchased at MM:SS**.
- After collapsing: the expanded details section disappears; the **+ Expand** button returns.

**Failure indicators:**

- Clicking **+ Expand** has no effect.
- Expanded section shows empty or duplicate content.
- **− Collapse** does not hide the expanded section.

---

### TC-9 — No injection events recorded → empty timeline message

**Scope:** A game that finishes with no deliveries in `game_injection` shows the empty-state message instead of an empty list.

**Steps:**

1. Create a new game.
2. Click **SAVE Items and START Simulation** immediately (no mitigations bought).
3. Immediately call `POST /admin/games/:id/finish` before any injections are delivered.

**Expected result:**

- The AAR page loads without error.
- The timeline area displays: **"No injection events recorded for this game."**
- No event chain cards are rendered.

**Failure indicators:**

- Spinner never resolves.
- An error alert appears instead of the empty-state message.
- An empty `<div>` is rendered with no text.

---

### TC-10 — API returns 404 for a non-existent game ID

**Scope:** The `GET /games/:gameId/aar` endpoint returns a 404 when the game does not exist, and the frontend displays the error alert.

> This test is primarily for robustness validation and is not required for routine feature testing.

**Steps:**

1. Navigate to `/?gameId=nonexistent-game-id` in the browser.

**Expected result:**

- After a brief loading state, a **danger alert** appears with a human-readable error message.
- No event chain cards are rendered.

**Failure indicators:**

- Spinner never resolves (no error surfaced).
- A JavaScript exception is logged to the console instead of a user-visible error.

---

## Pass Criteria

| Test Case | Description                                                                                     | Priority |
| --------- | ----------------------------------------------------------------------------------------------- | -------- |
| TC-1      | AAR page loads in ASSESSMENT state with header and non-empty timeline                           | Critical |
| TC-2      | Delivered injection with no follow-up renders a BLACK `THREAT INJECTED` card                    | Critical |
| TC-3      | Injection prevented by budget-item purchase renders a BLUE `EVENT PREVENTED` card               | Critical |
| TC-4      | Correct player response renders GREEN connector + GREEN `EVENT AVOIDED` follow-up card          | Critical |
| TC-5      | Incorrect/no response renders RED connector + RED `FOLLOW UP EVENT` follow-up card              | Critical |
| TC-6      | Post-event mitigation renders RED follow-up + GREEN connector + ORANGE `THREAT MITIGATION` card | High     |
| TC-7      | Undelivered injection (game finished early) renders GRAY `NOT REACHED` card                     | High     |
| TC-8      | Expand/collapse toggle reveals/hides AARExpandedDetails                                         | High     |
| TC-9      | Game with no delivered injections shows empty-timeline message                                  | Medium   |
| TC-10     | Non-existent game ID produces a visible error alert                                             | Low      |
