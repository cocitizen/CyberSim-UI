Start the backend project with

```bash
# sometimes you have to run it multiple times, because the DB is not set up at once.
npm run project:start
```

You can check the manual test case scenarios under `docs/testing` folder.

To start the E2E Tests, issue the following command:

```bash
npx playwright install --with-deps # install browser dependencies.
npx playwright test <YOUR_TEST_FILE> # use --headed flag, if you want to have a flickery UI screen as well.
```

---

## End-to-End Manual Walkthrough

This walkthrough covers the critical test cases from all three feature test files in a single sequential session. It is designed for a tester who wants to validate all three features — **Locked Response Visibility**, **Injection Budget Change**, and **After Action Review** — without starting over between features.

**Seed required:** `cso@2026-03-19.1`  
**Source docs:** `docs/testing/locked-response-visibility.md`, `docs/testing/injection-budget-change.md`, `docs/testing/after-action-review.md`

---

### Phase 1 — Setup

1. Start both servers (`npm run dev` in `CyberSim-Backend`, `npm start` in `CyberSim-UI`).
2. Open `http://localhost:3000` and create a new game using scenario `cso@2026-03-19.1`.
3. In the **Preparation** screen:
   - **Purchase** the mitigation _"Implement two-factor authentication for Director"_ (`recwp0KlSovcOxIiI`). This prevents injection **1005** and will produce a blue card in the AAR.
   - **Do not purchase** the four mitigation-gating mitigations below (they are needed in their locked state):
     - _"Set up and monitor a remote device management system..."_ (`recp4bX6SgSQcJtzU`, $1,500)
     - _"Establish secure backup solutions for all staff and volunteer devices..."_ (`recNg1ZHVUN0wrJg8`, $1,500)
     - _"Create a secure backup for the online contact management system"_ (`rect7BZ1qu3rICIfg`, $1,500)
     - _"Implement a trusted virtual private network (VPN) for all staff and volunteers"_ (`recp18ihMDxceH8kN`, $1,000)
   - Note the starting budget shown in the **BPT** bar (typically **$30,000**).
4. Click **SAVE Items and START Simulation**.

---

### Phase 2 — Locked Response Visibility (simulation view)

_Covers: locked-response-visibility TC-1, TC-2, TC-6_

**Check a locked response is visible and greyed out (TC-1):**

1. Navigate to the **LOCAL BRANCH** tab.
2. Deliver injection **1016** — _"Grassroots Network organizer's phone stolen"_.
3. Expand the injection accordion.
4. Verify that _"Rodrigo Wintz' phone remotely wiped"_ is visible but greyed out, has a lock icon, shows the hint `— Requires: Set up and monitor a remote device management system on all staff/volunteer mobile devices (Cost: $1500)`, and has its toggle disabled.

**Check a non-gated response is unaffected (TC-6):**

5. Deliver any injection without a required mitigation — e.g. injection **1001** _"Amazon databreach"_ or **1007** _"Cleaner quits"_.
6. Expand the accordion and confirm all responses appear at full opacity with no lock icon and fully functional toggles. This is a regression check.

**Unlock a response mid-game (TC-2):**

7. Navigate to the **ACTION TABLE** tab and purchase _"Set up and monitor a remote device management system on all staff/volunteer mobile devices"_ (`recp4bX6SgSQcJtzU`).
8. Navigate back to **LOCAL BRANCH** and re-expand injection **1016**.
9. Confirm _"Rodrigo Wintz' phone remotely wiped"_ is now at full opacity, the lock icon and hint are gone, and the toggle is enabled.

---

### Phase 3 — Injection Budget Change (simulation view)

_Covers: injection-budget-change TC-1, TC-5, TC-8, TC-4_

**Budget field appears on an injection with a negative budget_change (TC-1):**

1. Navigate to the **CAMPAIGN HQ** tab.
2. Deliver injection **1022** — _"Strategy leaked"_ (`budget_change: -500`, `poll_change: -3%`).
3. Expand the injection accordion.
4. Confirm a **Budget** field is visible showing **-$500**, and the **Poll** field shows **-3%**. Check the BPT bar decreases by $500.

**No Budget field on an injection without a budget_change (TC-5):**

5. Deliver any injection not in the budget-change test data table (e.g. injection **1007** _"Cleaner quits"_).
6. Expand the accordion and confirm no **Budget** field appears. All other fields behave normally.

**Positive budget_change increases game budget (TC-8):**

7. Note the current budget in the BPT bar.
8. Deliver injection **1003** — _"Phone call from an MP"_ (`budget_change: +750`).
9. Expand the accordion and confirm a **Budget** field shows **$750** and the BPT bar immediately increases by $750.

**Injection with budget_change but no poll_change renders both fields correctly (TC-4):**

10. Navigate to the **LOCAL BRANCH** tab.
11. Deliver injection **1055** — _"Ransomware attack disables GN computers"_ (`budget_change: -2000`, `poll_change: null`).
12. Expand the accordion. Confirm **Budget** shows **-$2,000** and **Poll** shows a dash (`-`). Confirm the BPT bar does not go below $0.

---

### Phase 4 — After Action Review setup (Game 1: green / avoided chain)

_Covers: after-action-review TC-4 setup_

Before finishing the simulation, set up the event chain needed to test the green "EVENT AVOIDED" card:

1. Navigate to the **LOCAL BRANCH** tab.
2. Deliver injection **1000** — _"Photo sharing on (infected) personal USB"_.
3. Expand the injection accordion and submit the **correct** response: _"Reformat computers"_ (`recrsPq1oq92DWMB8`).
4. Click **RESOLVE EVENT**. The follow-up injection **1055** should now be marked as prevented (do not deliver it again).

---

### Phase 5 — Finish Game 1 and inspect the AAR page

_Covers: after-action-review TC-1, TC-2, TC-3, TC-4, TC-7, TC-8_

1. Click **FINISH SIMULATION** (or call `POST /admin/games/:id/finish`). The app should transition to the **After Action Review** page automatically.

**AAR page loads (TC-1):**

2. Confirm the heading **After Action Review** is visible, the game ID and final budget/poll values appear, at least one event chain card is visible, and no error alert is shown.

**BLACK "THREAT INJECTED" card (TC-2):**

3. Locate the card for injection **1022** — _"Strategy leaked"_. Confirm it has a black header labelled **THREAT INJECTED** and shows the injection title and description.

**BLUE "EVENT PREVENTED" card (TC-3):**

4. Locate the card for injection **1005** — _"Incoming email (Spearphishing)"_. Confirm it has a blue header labelled **EVENT PREVENTED thanks to... IMPLEMENT TWO-FACTOR AUTHENTICATION FOR DIRECTOR**. The follow-up injection **1022** — _"Strategy leaked"_ — should **not** appear as a separate top-level entry (its chain was suppressed).

**GREEN connector + GREEN "EVENT AVOIDED" follow-up card (TC-4):**

5. Locate the card for injection **1000** — _"Photo sharing on (infected) personal USB"_. Confirm:
   - Parent card has a **black** header (`THREAT INJECTED`).
   - Below it, a **green** connector shows a ✓ icon labelled **Correct response: REFORMAT COMPUTERS**.
   - Below the connector, a **green** follow-up card for injection **1055** shows the header `EVENT AVOIDED`.
   - Injection **1055** does not appear as a separate top-level entry.

**GRAY "NOT REACHED" card (TC-7):**

6. Scroll the timeline and locate at least one card with a gray header labelled **NOT REACHED**. These represent injections whose trigger time was beyond the point the game was finished. Confirm no response connector or follow-up card is attached below a NOT REACHED card.

**Expand / collapse toggle (TC-8):**

7. On any black card, click the **+ Expand** button in the card footer. Confirm an _"Actions to prevent event"_ section appears listing all possible responses. Any response actually submitted should show **action taken** with a ✓.
8. Click **− Collapse** and confirm the expanded section hides and the **+ Expand** button returns.

---

### Phase 6 — Red follow-up and orange mitigation chains (Game 2)

_Covers: after-action-review TC-5, TC-6_

> **Why a second game?** TC-5 and TC-6 require injection **1000** to go **unresolved** so that its follow-up **1055** is delivered. This directly conflicts with the Game 1 setup where **1000** was resolved correctly (TC-4). Start a fresh game for this phase.

**New game setup:**

1. Create a new game using scenario `cso@2026-03-19.1`. No specific mitigation purchases are required — click **SAVE Items and START Simulation** immediately.

**RED connector + RED "FOLLOW UP EVENT" card (TC-5):**

2. Navigate to the **LOCAL BRANCH** tab and deliver injection **1000** — _"Photo sharing on (infected) personal USB"_.
3. Do **not** submit any response — leave the injection unresolved (or dismiss the accordion without selecting a response).
4. Deliver the follow-up injection **1055** — _"Ransomware attack disables GN computers"_.
5. Click **FINISH SIMULATION** and wait for the AAR page to load.
6. Locate the event chain for injection **1000**. Confirm:
   - Parent card has a **black** header (`THREAT INJECTED`).
   - Below it, a **red** connector shows a ✗ icon labelled **Incorrect response: No response**.
   - Below the connector, a **red** follow-up card for injection **1055** has the header `FOLLOW UP EVENT`.
   - If poll or budget impact values are defined for **1055**, they appear in the header (e.g. `POLLS: -2%`).
   - No orange mitigation card is present below the red follow-up (no post-event response was submitted).

**Failure indicators:**

- Connector is green instead of red.
- Follow-up card header reads `EVENT AVOIDED` instead of `FOLLOW UP EVENT`.
- Injection **1055** appears as a separate, unconnected top-level card rather than nested under **1000**.

---

**ORANGE "THREAT MITIGATION" card after red follow-up (TC-6):**

Restart from a fresh game (same seed, no required mitigations) and repeat steps 2–4 above, but this time also submit a post-event mitigation response on injection **1055** before finishing:

1. After delivering **1055**, expand its injection accordion.
2. Submit the post-event response _"Pay ransomware"_ (`rechRUVEgvtP0rx76`, cost: $1,500) and click **RESOLVE EVENT**.
3. Click **FINISH SIMULATION** and wait for the AAR page to load.
4. Locate the event chain for injection **1000**. Confirm the full four-card chain:
   - **Black** parent card for **1000** — `THREAT INJECTED`.
   - **Red** connector — ✗ — **Incorrect response: No response**.
   - **Red** follow-up card for **1055** — `FOLLOW UP EVENT`.
   - Below the red follow-up: a **green** mitigation connector showing a ✓ icon labelled **Mitigation: PAY RANSOMWARE**.
   - Below the mitigation connector: an **orange** mitigation card with header `THREAT MITIGATION` and a cost label (e.g. `- 1500 USD`). The card body shows the mitigation or response description.

**Failure indicators:**

- Orange card is absent despite a post-event response being submitted.
- The connector between the red follow-up and the orange card is missing or the wrong colour.
- Orange card body is blank.
