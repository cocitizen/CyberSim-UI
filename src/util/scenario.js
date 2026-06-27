// src/util/scenario.js
//
// Resolves the current scenario slug from the hostname.
//
// Production:  cso.cybersim.app      → 'cso'
//              campaign.cybersim.app → 'campaign'
// Bare domain: cybersim.app          → REACT_APP_SCENARIO_SLUG env var, or 'cso'
// Local dev:   localhost             → REACT_APP_SCENARIO_SLUG env var, or 'cso'

export function getScenarioSlug() {
  const hostname = window.location.hostname;
  const parts = hostname.split('.');

  // Check the length of the URL. If you've got a subdomain, we will assume it is the scenario.
  if (parts.length <= 2 || parts[0] === 'localhost') {
    const slug = process.env.REACT_APP_SCENARIO_SLUG;
    if (!slug) {
      console.warn(
        'React App Scenario Slug not configured; defaulting to "cso". ' +
          'Set REACT_APP_SCENARIO_SLUG in your .env to match the scenario your backend has loaded.',
      );
      return 'cso';
    }
    return slug;
  }

  return parts[0];
}
