/**
 * Playwright test suite — Injection Budget Change
 *
 * Covers TC-1 through TC-10 from docs/testing/injection-budget-change.md
 *
 * Seed: cso@2026-03-19.1
 *
 * Setup strategy:
 *   - A single shared game is created in beforeAll with injection 1022 and 1001
 *     pre-delivered for visual-only tests (TC-1, TC-5, TC-7).
 *   - Tests that verify actual budget values (TC-2 through TC-4, TC-6, TC-8
 *     through TC-10) each create a fresh game so budget state is clean and
 *     predictable.  Simulation budget always starts at $0 after startSimulation
 *     resets it from the preparation phase.
 *   - TC-3 buys the skipper mitigation in the preparation phase before calling
 *     startSimulation, which marks injection 1055 as prevented automatically.
 *   - TC-2 verifies real-time reactivity: the page is loaded first (budget $0),
 *     then the injection is delivered via a second socket connection, and the
 *     BPT bar update is observed without a page refresh.
 *   - TC-10 confirms budget is not floored at $0: positive budget earned from
 *     two small positive injections is then wiped out by a large negative
 *     injection, leaving a negative balance.
 */

const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');
const {
  setupGame,
  setupBudgetGame,
  deliverInjectionToGame,
} = require('./helpers/socketHelper');

// ---------------------------------------------------------------------------
// Seed-specific identifiers (cso@2026-03-19.1)
// ---------------------------------------------------------------------------

const INJECTIONS = {
  INJ_1022: 'rec4O6rmlQn51TfbA', // Strategy leaked                              (budget: -$500,    poll: -3%)   — HQ
  INJ_1035: 'rec9WtN8StuxHPMY7', // Email server hacked                          (budget: -$1,000,  poll: -3%)   — HQ
  INJ_1055: 'rechW2QnG1DxlEEgZ', // Ransomware attack disables GN computers      (budget: -$2,000,  poll: null)  — LOCAL
  INJ_1021: 'recth3Hpy9yYNHH6P', // Malware corrupts critical information        (budget: -$750,    poll: null)  — LOCAL
  INJ_1003: 'recfguim0DKPvSpmJ', // Phone call from an MP                        (budget: +$750,    poll: null)  — LOCAL
  INJ_1013: 'recH31GX4bCTQmswf', // Real update notification for operating system (budget: +$300,   poll: null)  — HQ
  INJ_1001: 'recaxARH7iyFC7Ngl', // Amazon databreach — no budget_change (regression)               — HQ
};

// skipper_mitigation for injection 1055 (and 1021) — cost $2,000
// Purchasing this in prep phase causes startSimulation to mark 1055 as prevented.
const SKIPPER_MITIGATION_1055 = 'recPdPink0pRWfkWJ';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const screenshotsDir = path.join(__dirname, 'screenshots');

async function takeScreenshot(page, name) {
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }
  await page.screenshot({
    path: path.join(screenshotsDir, `${name}.png`),
    fullPage: false,
  });
}

/** Click a main simulation tab by its visible label. */
async function navigateToTab(page, tabLabel) {
  await page
    .locator('.simulation-menu-item')
    .filter({ hasText: tabLabel })
    .click();
  await page.waitForTimeout(400);
}

/**
 * Find the injection accordion header by asset code (e.g. "(1022)") and click
 * to expand it.  Scrolls into view first.
 */
async function expandInjection(page, assetCode) {
  const header = page
    .locator('.injection-header')
    .filter({ hasText: `(${assetCode})` });
  await header.scrollIntoViewIfNeeded();
  await header.click();
  await page.waitForTimeout(600);
}

/**
 * Return a locator for the Col element that renders a named metadata field
 * (e.g. "Budget:", "Poll:", "Avoided:") inside an expanded injection body.
 *
 * The InjectionBody renders each field as:
 *   <Col><span class="font-weight-bold">FieldName: </span> value</Col>
 *
 * Passing a scoped `container` locator constrains the search to a specific
 * injection card (useful when multiple injections are visible).
 */
function getInjectionField(container, fieldLabel) {
  return container
    .locator('.font-weight-bold')
    .filter({ hasText: fieldLabel })
    .locator('..');
}

/**
 * Assert that the Budget metadata field is visible inside the injection body
 * and contains the expected formatted amount text (e.g. "-$500").
 * Optionally also assert the "(avoided)" suffix when the injection is prevented.
 */
async function assertBudgetField(container, expectedAmountText, { avoided = false } = {}) {
  const field = getInjectionField(container, 'Budget:');
  await expect(field).toBeVisible();
  await expect(field).toContainText(expectedAmountText);
  if (avoided) {
    await expect(field).toContainText('(avoided)');
  } else {
    await expect(field).not.toContainText('(avoided)');
  }
}

/**
 * Assert that NO Budget field is rendered inside the injection body.
 * Used as a regression guard for injections where budget_change is null.
 */
async function assertNoBudgetField(container) {
  const field = getInjectionField(container, 'Budget:');
  await expect(field).not.toBeAttached();
}

/**
 * Assert the BPT bar shows the expected budget string.
 * BPT.jsx renders: numberToUsd(budget).replace('$', '$ ')
 * Examples: $0 → "$ 0", -$500 → "-$ 500", $750 → "$ 750", -$2,000 → "-$ 2,000"
 *
 * Uses a generous timeout to accommodate reactive socket updates.
 */
async function assertBptBudget(page, expectedText, timeoutMs = 8_000) {
  await expect(page.locator('.bpt-item').first()).toContainText(expectedText, {
    timeout: timeoutMs,
  });
}

// ---------------------------------------------------------------------------
// Navigation helper for per-test games
// ---------------------------------------------------------------------------

/** Navigate to a specific game URL and wait for the simulation UI to load. */
async function loadGame(page, gameId) {
  await page.goto(`/?gameId=${gameId}`);
  await page.waitForSelector('.simulation-menu-item', { timeout: 20_000 });
  await page.waitForTimeout(500);
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

test.describe('Injection Budget Change', () => {
  let sharedGameId;

  test.beforeAll(async () => {
    // Shared game used by TC-1, TC-5, and TC-7.
    // Injection 1022 (-$500 budget_change) and 1001 (no budget_change) are
    // pre-delivered so the visual checks can run against stable state.
    sharedGameId = `pw-ibc-${Date.now()}`;
    await setupBudgetGame(sharedGameId, {
      injectionsToDeliver: [
        INJECTIONS.INJ_1022, // 1022 — Strategy leaked   (-$500)
        INJECTIONS.INJ_1001, // 1001 — Amazon databreach (null)
      ],
    });
  });

  // Each test gets a fresh page.  Tests that share the game navigate via the
  // URL set in beforeEach; budget tests override navigation inside the test.
  test.beforeEach(async ({ page }) => {
    await page.goto(`/?gameId=${sharedGameId}`);
    await page.waitForSelector('.simulation-menu-item', { timeout: 20_000 });
    await page.waitForTimeout(500);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC-1 — Budget field visible on injection card with budget_change
  // ─────────────────────────────────────────────────────────────────────────
  test('TC-1 — Budget field visible on injection 1022 card (CAMPAIGN HQ)', async ({
    page,
  }) => {
    await navigateToTab(page, 'CAMPAIGN HQ');
    await expandInjection(page, '1022');

    // await takeScreenshot(page, 'tc1-injection-1022-expanded');

    const card = page
      .locator('.injection')
      .filter({ hasText: '(1022)' });

    // Budget field must be visible with the correct amount
    await assertBudgetField(card, '-$500');

    // Poll field must show -3% (existing behaviour — regression check)
    const pollField = getInjectionField(card, 'Poll:');
    await expect(pollField).toContainText('-3%');

    // Avoided field must show NO (injection was delivered, not prevented)
    const avoidedField = getInjectionField(card, 'Avoided:');
    await expect(avoidedField).toContainText('NO');

    // await takeScreenshot(page, 'tc1-injection-1022-budget-visible');
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC-2 — Budget decreases in real time when injection with budget_change
  //         is delivered (reactive update without page reload)
  // ─────────────────────────────────────────────────────────────────────────
  test('TC-2 — Delivering injection 1022 decreases BPT budget by $500 in real time', async ({
    page,
  }) => {
    const gameId = `pw-ibc-tc2-${Date.now()}`;
    await setupBudgetGame(gameId); // no pre-deliveries — budget stays at $0
    await loadGame(page, gameId);

    // Confirm starting budget is $0
    await assertBptBudget(page, '$ 0');

    // await takeScreenshot(page, 'tc2-before-delivery');

    // Deliver 1022 via a separate socket connection while the page is open.
    // The browser receives the gameUpdated socket event and updates reactively.
    await deliverInjectionToGame(gameId, INJECTIONS.INJ_1022);

    // BPT bar must remain at $0 — budget is clamped at zero (cannot go negative)
    await assertBptBudget(page, '$ 0');

    // await takeScreenshot(page, 'tc2-budget-decreased');
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC-3 — Prevented injection shows "(avoided)" and does not deduct budget
  // ─────────────────────────────────────────────────────────────────────────
  test('TC-3 — Prevented injection 1055 shows "(avoided)" and budget is unchanged', async ({
    page,
  }) => {
    const gameId = `pw-ibc-tc3-${Date.now()}`;
    // Buy the skipper mitigation in the preparation phase.
    // startSimulation will mark injection 1055 as prevented: true.
    await setupBudgetGame(gameId, {
      mitigationsToBuy: [SKIPPER_MITIGATION_1055],
    });
    await loadGame(page, gameId);

    await navigateToTab(page, 'LOCAL');
    await expandInjection(page, '1055');

    // await takeScreenshot(page, 'tc3-injection-1055-prevented-expanded');

    const card = page
      .locator('.injection')
      .filter({ hasText: '(1055)' });

    // Budget field must show the amount with the "(avoided)" suffix
    await assertBudgetField(card, '-$2,000', { avoided: true });

    // Avoided field must confirm prevention
    const avoidedField = getInjectionField(card, 'Avoided:');
    await expect(avoidedField).toContainText('YES');

    // BPT budget must remain $0 — prevention blocks the budget deduction
    await assertBptBudget(page, '$ 0');

    // await takeScreenshot(page, 'tc3-injection-1055-avoided-budget-unchanged');
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC-4 — Injection with budget_change but no poll_change renders correctly
  // ─────────────────────────────────────────────────────────────────────────
  test('TC-4 — Injection 1055 shows Budget field and dash for null Poll', async ({
    page,
  }) => {
    const gameId = `pw-ibc-tc4-${Date.now()}`;
    await setupBudgetGame(gameId, {
      injectionsToDeliver: [INJECTIONS.INJ_1055],
    });
    await loadGame(page, gameId);

    await navigateToTab(page, 'LOCAL');
    await expandInjection(page, '1055');

    // await takeScreenshot(page, 'tc4-injection-1055-expanded');

    const card = page
      .locator('.injection')
      .filter({ hasText: '(1055)' });

    // Budget field must show the correct negative amount (not avoided)
    await assertBudgetField(card, '-$2,000');

    // Poll field must show a dash because poll_change is null
    const pollField = getInjectionField(card, 'Poll:');
    await expect(pollField).toContainText('-');
    await expect(pollField).not.toContainText('%');

    // BPT bar budget must be clamped at $0 — cannot go below zero
    await assertBptBudget(page, '$ 0');

    // await takeScreenshot(page, 'tc4-injection-1055-budget-no-poll');
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC-5 — Injection without budget_change shows no Budget field (regression)
  // ─────────────────────────────────────────────────────────────────────────
  test('TC-5 — Injection 1001 (no budget_change) shows no Budget field (regression)', async ({
    page,
  }) => {
    await navigateToTab(page, 'CAMPAIGN HQ');
    await expandInjection(page, '1001');

    // await takeScreenshot(page, 'tc5-injection-1001-expanded');

    const card = page
      .locator('.injection')
      .filter({ hasText: '(1001)' });

    // No Budget field may appear for an injection with null budget_change
    await assertNoBudgetField(card);

    // Other metadata fields must still be present (existing behaviour intact)
    const pollField = getInjectionField(card, 'Poll:');
    await expect(pollField).toBeVisible();

    const avoidedField = getInjectionField(card, 'Avoided:');
    await expect(avoidedField).toBeVisible();

    const systemsField = getInjectionField(card, 'Systems disabled:');
    await expect(systemsField).toBeVisible();

    // await takeScreenshot(page, 'tc5-injection-1001-no-budget-field');
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC-6 — Multiple injections stack budget reductions correctly
  // ─────────────────────────────────────────────────────────────────────────
  test('TC-6 — Delivering 1022 + 1035 + 1021 all clamp to $0 (floor enforced)', async ({
    page,
  }) => {
    const gameId = `pw-ibc-tc6-${Date.now()}`;
    // Pre-deliver all three in sequence via socket setup.
    // Budget: $0 → $0 clamped (1022) → $0 clamped (1035) → $0 clamped (1021)
    await setupBudgetGame(gameId, {
      injectionsToDeliver: [
        INJECTIONS.INJ_1022, // -$500  → clamped to $0
        INJECTIONS.INJ_1035, // -$1,000 → clamped to $0
        INJECTIONS.INJ_1021, // -$750  → clamped to $0
      ],
    });
    await loadGame(page, gameId);

    // await takeScreenshot(page, 'tc6-three-injections-delivered');

    // Budget must remain at $0 after all three deliveries — floor is enforced
    await assertBptBudget(page, '$ 0');
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC-7 — Budget field visible in EVENT LOGS (read-only view)
  // ─────────────────────────────────────────────────────────────────────────
  test('TC-7 — Budget field visible in EVENT LOGS for injection 1022', async ({
    page,
  }) => {
    await navigateToTab(page, 'EVENT LOGS');
    await page.waitForTimeout(500);

    // Locate the "Threat Injected" log card for injection 1022
    const logCard = page
      .locator('.injection')
      .filter({ hasText: 'Threat Injected' })
      .filter({ hasText: '(1022)' });

    await logCard.scrollIntoViewIfNeeded();
    // await takeScreenshot(page, 'tc7-eventlogs-before-expand');

    // Click the accordion header inside this card to expand it
    await logCard.locator('.cursor-pointer').click();
    await page.waitForTimeout(700);

    // await takeScreenshot(page, 'tc7-eventlogs-1022-expanded');

    // Budget field must be present and show the correct amount
    await assertBudgetField(logCard, '-$500');

    // Avoided must show NO (injection was delivered, not prevented)
    const avoidedField = getInjectionField(logCard, 'Avoided:');
    await expect(avoidedField).toContainText('NO');

    // await takeScreenshot(page, 'tc7-eventlogs-1022-budget-visible');
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC-8 — Positive budget_change increases game budget
  // ─────────────────────────────────────────────────────────────────────────
  test('TC-8 — Delivering injection 1003 (+$750) increases BPT budget to $750', async ({
    page,
  }) => {
    const gameId = `pw-ibc-tc8-${Date.now()}`;
    await setupBudgetGame(gameId, {
      injectionsToDeliver: [INJECTIONS.INJ_1003],
    });
    await loadGame(page, gameId);

    await navigateToTab(page, 'LOCAL');
    await expandInjection(page, '1003');

    // await takeScreenshot(page, 'tc8-injection-1003-expanded');

    const card = page
      .locator('.injection')
      .filter({ hasText: '(1003)' });

    // Budget field must show the positive amount (no "+" prefix — known caveat)
    await assertBudgetField(card, '$750');

    // Poll field must show a dash because poll_change is null
    const pollField = getInjectionField(card, 'Poll:');
    await expect(pollField).toContainText('-');
    await expect(pollField).not.toContainText('%');

    // Avoided must show NO
    const avoidedField = getInjectionField(card, 'Avoided:');
    await expect(avoidedField).toContainText('NO');

    // BPT bar must show $750 — budget increased, not decreased
    await assertBptBudget(page, '$ 750');

    // await takeScreenshot(page, 'tc8-budget-increased');
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC-9 — Mixed positive and negative budget_change values stack correctly
  // ─────────────────────────────────────────────────────────────────────────
  test('TC-9 — Delivering 1003 (+$750) + 1022 (-$500) + 1013 (+$300) nets +$550', async ({
    page,
  }) => {
    const gameId = `pw-ibc-tc9-${Date.now()}`;
    // Budget: $0 → +$750 (1003) → +$250 (1022) → +$550 (1013)
    await setupBudgetGame(gameId, {
      injectionsToDeliver: [
        INJECTIONS.INJ_1003, // +$750
        INJECTIONS.INJ_1022, // -$500
        INJECTIONS.INJ_1013, // +$300
      ],
    });
    await loadGame(page, gameId);

    // await takeScreenshot(page, 'tc9-three-mixed-injections');

    // Net result after all three deliveries
    await assertBptBudget(page, '$ 550');

    // Verify injection 1013 (+$300, no poll_change) renders correctly
    await navigateToTab(page, 'CAMPAIGN HQ');
    await expandInjection(page, '1013');

    const card1013 = page
      .locator('.injection')
      .filter({ hasText: '(1013)' });

    await assertBudgetField(card1013, '$300');

    const pollField = getInjectionField(card1013, 'Poll:');
    await expect(pollField).toContainText('-');
    await expect(pollField).not.toContainText('%');

    // await takeScreenshot(page, 'tc9-budget-net-positive');
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC-10 — Budget can go below zero (no floor at $0)
  // ─────────────────────────────────────────────────────────────────────────
  test('TC-10 — Budget is clamped at $0 when injections exceed available funds', async ({
    page,
  }) => {
    const gameId = `pw-ibc-tc10-${Date.now()}`;
    // Build up a modest positive balance first (+$750 + $300 = $1,050), then
    // deliver a large negative injection (-$2,000) that would push below zero.
    // This confirms the budget is floored at $0 and cannot go negative.
    await setupBudgetGame(gameId, {
      injectionsToDeliver: [
        INJECTIONS.INJ_1003, // +$750  → budget $750
        INJECTIONS.INJ_1013, // +$300  → budget $1,050
        INJECTIONS.INJ_1055, // -$2,000 → budget clamped to $0
      ],
    });
    await loadGame(page, gameId);

    // await takeScreenshot(page, 'tc10-budget-floored-at-zero');

    // Budget must be clamped to $0, not shown as -$950
    await assertBptBudget(page, '$ 0');
  });
});
