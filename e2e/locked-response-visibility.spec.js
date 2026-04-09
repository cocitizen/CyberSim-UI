/**
 * Playwright test suite — Locked Response Visibility
 *
 * Covers TC-1 through TC-7 from docs/testing/locked-response-visibility.md
 *
 * Seed: cso@2026-03-19.1
 *
 * Setup strategy:
 *   - A single game is created via Node.js socket before any test runs.
 *   - All relevant injections are delivered via socket (bypassing the frontend
 *     trigger-time guard — the backend does not enforce it on deliverInjection).
 *   - No gating mitigations are purchased during setup, so all locked responses
 *     start in the locked state.
 *   - TC-2/3/4/5 unlock tests purchase mitigations through the UI and verify
 *     reactive state updates.
 *   - TC-7 runs before TC-2 to catch the MDM-locked state before TC-2 buys MDM.
 */

const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');
const { setupGame } = require('./helpers/socketHelper');

// ---------------------------------------------------------------------------
// Seed-specific identifiers (cso@2026-03-19.1)
// ---------------------------------------------------------------------------

const INJECTIONS = {
  INJ_1016: 'recRJh7cpEgDrAbQ0', // Grassroots Network organizer's phone stolen (1016) — LOCAL
  INJ_1021: 'recth3Hpy9yYNHH6P', // Malware corrupts critical information (1021)         — LOCAL
  INJ_1055: 'rechW2QnG1DxlEEgZ', // Ransomware attack disables GN computers (1055)       — LOCAL
  INJ_1048: 'recHhJpOvsfUi3x7L', // Contact management system deleted suddenly (1048)    — HQ
  INJ_1006: 'recaV5aL9GR8xYZdD', // Access to Facebook blocked in area (1006)            — LOCAL
  INJ_1001: 'recaxARH7iyFC7Ngl', // Amazon databreach (1001)                              — HQ
};

const RESPONSES = {
  RESP_MDM: 'recgBa7yXhB6iYeh9', // Rodrigo Wintz' phone remotely wiped     (requires MDM)
  RESP_BACKUP: 'recP58NIM7Ez2swSb', // Restore supporter files from backup      (requires device backup)
  RESP_CMS_BACKUP: 'recTdnubRgXFq4f5X', // Access CMS backup                        (requires CMS backup)
  RESP_VPN: 'recuQGP1QAP6j5UHU', // Use already purchased trusted VPN        (requires VPN)
  RESP_CHANGE_PW: 'recXu4q3XyUSrTMcT', // Change passwords                         (no gate)
  RESP_FREE_VPN: 'recW0IavH3n28d0oy', // Use a free VPN                           (no gate)
  RESP_TRUSTED_VPN: 'recNAEagY3KQtztvp', // Use a trusted VPN to circumvent blocking (no gate)
};

const MITIGATIONS = {
  MDM: 'recp4bX6SgSQcJtzU', // Set up and monitor a remote device management system
  DEVICE_BKUP: 'recNg1ZHVUN0wrJg8', // Establish secure backup solutions for all staff devices
  CMS_BKUP: 'rect7BZ1qu3rICIfg', // Create a secure backup for the online contact management system
  VPN: 'recp18ihMDxceH8kN', // Implement a trusted virtual private network (VPN)
};

// Mitigation hint text shown in the locked-response-hint span
const REQUIRES_TEXT = {
  MDM: 'Set up and monitor a remote device management system on all staff/volunteer mobile devices',
  DEVICE_BKUP:
    'Establish secure backup solutions for all staff and volunteer devices and data',
  CMS_BKUP:
    'Create a secure backup for the online contact management system',
  VPN: 'Implement a trusted virtual private network (VPN) for all staff and volunteers',
};

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
 * Find the injection accordion header by asset code (e.g. "(1016)") and click
 * to expand it.  Scrolls into view first.
 */
async function expandInjection(page, assetCode) {
  const header = page
    .locator('.injection-header')
    .filter({ hasText: `(${assetCode})` });
  await header.scrollIntoViewIfNeeded();
  await header.click();
  await page.waitForTimeout(600); // allow accordion animation to finish
}

/**
 * Assert that a response switch is locked:
 *   - The <input> is disabled
 *   - The .locked-response-hint span is visible and contains the expected text
 *   - An SVG lock icon is visible in the label
 *   - The main label shows the response's own cost (Cost: $0 for
 *     mitigation-gated responses)
 *   - The hint span also contains the mitigation's purchase cost (non-zero)
 */
async function assertResponseLocked(
  page,
  injectionId,
  responseId,
  requiresText,
) {
  const switchId = `${injectionId}_${responseId}`;

  // Input must be disabled
  await expect(page.locator(`#${switchId}`)).toBeDisabled();

  // Hint text must be present inside the label
  const hint = page.locator(
    `label[for="${switchId}"] .locked-response-hint`,
  );
  await expect(hint).toBeVisible();
  await expect(hint).toContainText(requiresText);

  // Lock icon (SVG) must appear in the label
  const lockIcon = page.locator(`label[for="${switchId}"] svg`);
  await expect(lockIcon).toBeVisible();

  // Main label shows the response's own cost ($0 for mitigation-gated responses)
  const label = page.locator(`label[for="${switchId}"]`);
  await expect(label).toContainText('Cost: $0');

  // Hint must also display the mitigation's purchase cost (non-zero)
  await expect(hint).toContainText('(Cost: $');
  await expect(hint).not.toContainText('(Cost: $0)');
}

/**
 * Assert that a response switch is unlocked:
 *   - The <input> is enabled
 *   - No .locked-response-hint is present in the label
 *   - If expectZeroCost is true, the label shows "Cost: $0" (mitigation was
 *     already purchased, so using this response carries no additional cost)
 */
async function assertResponseUnlocked(
  page,
  injectionId,
  responseId,
  expectZeroCost = false,
) {
  const switchId = `${injectionId}_${responseId}`;

  await expect(page.locator(`#${switchId}`)).not.toBeDisabled();

  const hint = page.locator(
    `label[for="${switchId}"] .locked-response-hint`,
  );
  await expect(hint).not.toBeAttached();

  if (expectZeroCost) {
    const label = page.locator(`label[for="${switchId}"]`);
    await expect(label).toContainText('Cost: $0');
  }
}

/**
 * Navigate to ACTION TABLE, earn enough simulation budget via a free repeatable
 * campaign action, then purchase the given mitigation by clicking its toggle.
 *
 * Free action: GN Volunteer_recclPV2HsQ9uK3tT — +$400 budget per perform.
 * The loop runs until the mitigation toggle becomes enabled so it correctly
 * handles budgets that start below zero (e.g. after a budget-change injection).
 */
async function purchaseMitigationViaUI(page, mitigationId) {
  await navigateToTab(page, 'ACTION TABLE');

  const FREE_ACTION_ID = 'GN Volunteer_recclPV2HsQ9uK3tT';

  const radio = page.locator(`label[for="${FREE_ACTION_ID}"]`);
  await radio.scrollIntoViewIfNeeded();

  const form = page.locator('form').filter({ has: radio });
  const submitBtn = form.locator('button[type="submit"]');

  // Keep earning budget until the mitigation toggle becomes enabled.
  // Budget may start below zero, so we check the actual DOM state rather than
  // a fixed iteration count — stop as soon as the toggle is enabled.
  for (let i = 0; i < 20; i++) {
    await radio.click();
    await submitBtn.click();
    await page.waitForTimeout(600);

    const isEnabled = await page.evaluate(
      (id) => !document.querySelector(`#${id}`)?.disabled,
      mitigationId,
    );
    if (isEnabled) break;
  }

  // Scroll to mitigations section
  const inventorySection = page.locator('#mitigations');
  await inventorySection.scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);

  const label = page.locator(`label[for="${mitigationId}"]`);
  await label.scrollIntoViewIfNeeded();

  // Final guard — ensures the toggle is enabled before we click it
  await page.waitForFunction(
    (id) => !document.querySelector(`#${id}`)?.disabled,
    mitigationId,
    { timeout: 10_000 },
  );

  // Register a one-time dialog handler to accept the confirmation prompt
  page.once('dialog', (dialog) => dialog.accept());

  await label.click();

  // Wait until the checkbox flips to checked
  await expect(page.locator(`#${mitigationId}`)).toBeChecked({
    timeout: 8_000,
  });
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

test.describe('Locked Response Visibility', () => {
  let gameId;

  test.beforeAll(async () => {
    gameId = `pw-lrv-${Date.now()}`;
    await setupGame(gameId);
  });

  // Each test gets a fresh page and joins the game via query-param auto-join.
  test.beforeEach(async ({ page }) => {
    await page.goto(`/?gameId=${gameId}`);
    // Wait until the simulation tabs are rendered
    await page.waitForSelector('.simulation-menu-item', {
      timeout: 20_000,
    });
    // Brief pause so the reactive store has settled
    await page.waitForTimeout(500);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC-1 — MDM-gated response visible and locked (LOCAL / injection 1016)
  // ─────────────────────────────────────────────────────────────────────────
  test('TC-1 — MDM-gated response is locked in injection 1016 (LOCAL)', async ({
    page,
  }) => {
    await navigateToTab(page, 'LOCAL');
    await expandInjection(page, '1016');

    // await takeScreenshot(page, 'tc1-before-assertion');

    await assertResponseLocked(
      page,
      INJECTIONS.INJ_1016,
      RESPONSES.RESP_MDM,
      REQUIRES_TEXT.MDM,
    );

    // await takeScreenshot(page, 'tc1-injection-1016-response-locked');
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC-7 — Locked response visible in EVENT LOGS (read-only view)
  // Runs before TC-2 which purchases MDM, so the locked state is still active.
  // ─────────────────────────────────────────────────────────────────────────
  test('TC-7 — Locked response visible in EVENT LOGS for injection 1016', async ({
    page,
  }) => {
    await navigateToTab(page, 'EVENT LOGS');
    await page.waitForTimeout(500);

    // Locate the "Threat Injected" log card for injection 1016
    const logCard = page
      .locator('.injection')
      .filter({ hasText: 'Threat Injected' })
      .filter({ hasText: '(1016)' });

    await logCard.scrollIntoViewIfNeeded();
    // await takeScreenshot(page, 'tc7-eventlogs-before-expand');

    // Click the accordion header inside this card to expand it
    await logCard.locator('.cursor-pointer').click();
    await page.waitForTimeout(700);

    // await takeScreenshot(page, 'tc7-eventlogs-1016-expanded');

    const switchId = `${INJECTIONS.INJ_1016}_${RESPONSES.RESP_MDM}`;

    // The response switch must be present and disabled
    await expect(page.locator(`#${switchId}`)).toBeAttached();
    await expect(page.locator(`#${switchId}`)).toBeDisabled();

    // Locked hint must be visible
    const hint = page.locator(
      `label[for="${switchId}"] .locked-response-hint`,
    );
    await expect(hint).toBeVisible();
    await expect(hint).toContainText(REQUIRES_TEXT.MDM);

    // RESOLVE EVENT button must be present but disabled (read-only in logs)
    const resolveBtn = page
      .locator('button', { hasText: 'RESOLVE EVENT' })
      .first();
    await expect(resolveBtn).toBeDisabled();

    // await takeScreenshot(page, 'tc7-eventlogs-1016-locked-response');
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC-3 (lock) — CMS-backup-gated response locked (CAMPAIGN HQ / injection 1048)
  // ─────────────────────────────────────────────────────────────────────────
  test('TC-3a — CMS-backup-gated response is locked in injection 1048 (CAMPAIGN HQ)', async ({
    page,
  }) => {
    await navigateToTab(page, 'CAMPAIGN HQ');
    await expandInjection(page, '1048');

    await assertResponseLocked(
      page,
      INJECTIONS.INJ_1048,
      RESPONSES.RESP_CMS_BACKUP,
      REQUIRES_TEXT.CMS_BKUP,
    );

    // await takeScreenshot(page, 'tc3a-injection-1048-response-locked');
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC-4 (lock) — Backup-gated response locked in injections 1021 and 1055
  // ─────────────────────────────────────────────────────────────────────────
  test('TC-4a — Backup-gated response is locked in injection 1021 (LOCAL)', async ({
    page,
  }) => {
    await navigateToTab(page, 'LOCAL');
    await expandInjection(page, '1021');

    await assertResponseLocked(
      page,
      INJECTIONS.INJ_1021,
      RESPONSES.RESP_BACKUP,
      REQUIRES_TEXT.DEVICE_BKUP,
    );

    // await takeScreenshot(page, 'tc4a-injection-1021-response-locked');
  });

  test('TC-4a — Backup-gated response is locked in injection 1055 (LOCAL)', async ({
    page,
  }) => {
    await navigateToTab(page, 'LOCAL');
    await expandInjection(page, '1055');

    await assertResponseLocked(
      page,
      INJECTIONS.INJ_1055,
      RESPONSES.RESP_BACKUP,
      REQUIRES_TEXT.DEVICE_BKUP,
    );

    // await takeScreenshot(page, 'tc4a-injection-1055-response-locked');
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC-5 (lock) — VPN-gated response locked; non-gated VPN responses enabled
  // ─────────────────────────────────────────────────────────────────────────
  test('TC-5a — VPN-gated response is locked; other VPN responses are enabled (injection 1006)', async ({
    page,
  }) => {
    await navigateToTab(page, 'LOCAL');
    await expandInjection(page, '1006');

    // Gated VPN response must be locked
    await assertResponseLocked(
      page,
      INJECTIONS.INJ_1006,
      RESPONSES.RESP_VPN,
      REQUIRES_TEXT.VPN,
    );

    // The two non-gated VPN responses must NOT be locked
    const freeVpnSwitch = page.locator(
      `#${INJECTIONS.INJ_1006}_${RESPONSES.RESP_FREE_VPN}`,
    );
    await expect(freeVpnSwitch).not.toBeDisabled();

    const trustedVpnSwitch = page.locator(
      `#${INJECTIONS.INJ_1006}_${RESPONSES.RESP_TRUSTED_VPN}`,
    );
    await expect(trustedVpnSwitch).not.toBeDisabled();

    // await takeScreenshot(
    //  page,
    //  'tc5a-injection-1006-vpn-locked-others-enabled',
    //);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC-6 — Non-gated responses are unaffected (regression check)
  // ─────────────────────────────────────────────────────────────────────────
  test('TC-6 — Non-gated responses in injection 1001 are fully enabled (regression)', async ({
    page,
  }) => {
    await navigateToTab(page, 'CAMPAIGN HQ');
    await expandInjection(page, '1001');

    const switchId = `${INJECTIONS.INJ_1001}_${RESPONSES.RESP_CHANGE_PW}`;
    const input = page.locator(`#${switchId}`);

    // Response must exist and be enabled
    await expect(input).toBeAttached();
    await expect(input).not.toBeDisabled();

    // No lock hint anywhere near this response
    const hint = page.locator(
      `label[for="${switchId}"] .locked-response-hint`,
    );
    await expect(hint).not.toBeAttached();

    // No SVG lock icon in the label
    const lockIcon = page.locator(`label[for="${switchId}"] svg`);
    await expect(lockIcon).not.toBeAttached();

    // await takeScreenshot(
    //  page,
    //  'tc6-injection-1001-no-lock-regression',
    //);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC-2 — MDM-gated response unlocks reactively after mitigation purchase
  // ─────────────────────────────────────────────────────────────────────────
  test('TC-2 — Purchasing MDM mitigation unlocks injection 1016 response', async ({
    page,
  }) => {
    await purchaseMitigationViaUI(page, MITIGATIONS.MDM);
    // await takeScreenshot(page, 'tc2-mdm-mitigation-purchased');

    // Navigate back to LOCAL BRANCH and re-expand 1016
    await navigateToTab(page, 'LOCAL');
    await expandInjection(page, '1016');

    await assertResponseUnlocked(
      page,
      INJECTIONS.INJ_1016,
      RESPONSES.RESP_MDM,
      true,
    );

    // await takeScreenshot(
    //  page,
    //  'tc2-injection-1016-response-unlocked',
    //);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC-3 (unlock) — CMS backup purchase unlocks injection 1048
  // ─────────────────────────────────────────────────────────────────────────
  test('TC-3b — Purchasing CMS backup mitigation unlocks injection 1048 response', async ({
    page,
  }) => {
    await purchaseMitigationViaUI(page, MITIGATIONS.CMS_BKUP);
    // await takeScreenshot(page, 'tc3b-cms-backup-purchased');

    await navigateToTab(page, 'CAMPAIGN HQ');
    await expandInjection(page, '1048');

    await assertResponseUnlocked(
      page,
      INJECTIONS.INJ_1048,
      RESPONSES.RESP_CMS_BACKUP,
      true,
    );

    // await takeScreenshot(
    //  page,
    //  'tc3b-injection-1048-response-unlocked',
    //);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC-4 (unlock) — One backup purchase unlocks responses in both 1021 and 1055
  // ─────────────────────────────────────────────────────────────────────────
  test('TC-4b — Purchasing device-backup mitigation unlocks responses in injection 1021 and 1055', async ({
    page,
  }) => {
    await purchaseMitigationViaUI(page, MITIGATIONS.DEVICE_BKUP);
    // await takeScreenshot(page, 'tc4b-device-backup-purchased');

    await navigateToTab(page, 'LOCAL');

    // Injection 1021
    await expandInjection(page, '1021');
    await assertResponseUnlocked(
      page,
      INJECTIONS.INJ_1021,
      RESPONSES.RESP_BACKUP,
      true,
    );
    // await takeScreenshot(
    //  page,
    //  'tc4b-injection-1021-response-unlocked',
    //);

    // Injection 1055 — still on LOCAL tab, just scroll down
    await expandInjection(page, '1055');
    await assertResponseUnlocked(
      page,
      INJECTIONS.INJ_1055,
      RESPONSES.RESP_BACKUP,
      true,
    );
    // await takeScreenshot(
    //  page,
    //  'tc4b-injection-1055-response-unlocked',
    //);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC-5 (unlock) — VPN purchase unlocks injection 1006 response
  // ─────────────────────────────────────────────────────────────────────────
  test('TC-5b — Purchasing VPN mitigation unlocks injection 1006 response', async ({
    page,
  }) => {
    await purchaseMitigationViaUI(page, MITIGATIONS.VPN);
    // await takeScreenshot(page, 'tc5b-vpn-purchased');

    await navigateToTab(page, 'LOCAL');
    await expandInjection(page, '1006');

    await assertResponseUnlocked(
      page,
      INJECTIONS.INJ_1006,
      RESPONSES.RESP_VPN,
      true,
    );

    // await takeScreenshot(
    //  page,
    //  'tc5b-injection-1006-vpn-response-unlocked',
    //);
  });
});
