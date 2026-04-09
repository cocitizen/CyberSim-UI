# Locked Response Visibility

## Feature Request

Adjust the app UI so that event responses requiring a specific mitigation show up in the event widget as greyed out and unselectable, even when that required mitigation is not yet purchased. This gives the facilitator a visual cue to know whether a specific "purchase mitigation" could be useful for the responding player, and helps guide them to that answer during gameplay.

Previously, these options only appeared if the relevant mitigation was already purchased.

## What Was Modified

### 1. InjectionResponseForm.jsx (UI Component)

**File**: `src/components/Simulation/Injections/InjectionResponseForm.jsx`

The core change: responses requiring an unpurchased mitigation were previously **filtered out entirely** by the `availableResponses` filter. Now they are **always shown**, but marked as locked.

Specific changes:

- **Added `AiOutlineLock` icon import** — used as a visual lock indicator on locked responses.
- **Added `mitigations` to `useStaticData()` destructuring** — needed to look up mitigation names for the hint text.
- **Replaced `availableResponses` filter with `allResponses` map** — instead of filtering out responses with unmet mitigation requirements, it now maps over all responses and adds `isLocked` (boolean) and `requiredMitigationName` (string) properties to each.
- **Updated the response rendering**:
  - Locked responses get the `locked-response` CSS class (greyed out at 55% opacity).
  - A lock icon appears before the description with a tooltip showing the required mitigation.
  - Italic hint text after the cost shows "— Requires: [mitigation name]".
  - The switch is `disabled` so it cannot be toggled.
  - **Cost display**: the main label always shows the response's own cost (`responses[id].cost`), which is `$0` for mitigation-gated responses. In addition, the `locked-response-hint` span includes the mitigation's purchase cost in parentheses (e.g. `(Cost: $1500)`), so the facilitator can see how much it would cost to buy the mitigation that unlocks this response. Once the mitigation is purchased and the hint disappears, only the response's own `$0` cost remains.

### 2. index.scss (Styles)

**File**: `src/index.scss`

Added two new CSS rules:

- **`.locked-response`** — reduces opacity to 55% and sets `cursor: not-allowed` on the label, making locked responses visually distinct from available ones.
- **`.locked-response-hint`** — styles the "Requires: ..." text in smaller italic grey font.

## How It Affects the Codebase

- **No backend changes needed** — the backend already sends all responses including those with `required_mitigation` set. The server-side validation in `game.js:makeResponses()` still prevents locked responses from being submitted even if someone bypasses the UI.
- **No breaking changes** — responses without a `required_mitigation` render exactly as before. The only behavioral difference is that mitigation-gated responses are now visible (but disabled) instead of hidden.
- **Facilitator benefit** — during gameplay, facilitators can now see which responses could become available if specific mitigations were purchased, helping them guide players toward useful mitigation purchases.
