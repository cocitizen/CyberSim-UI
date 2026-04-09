# After Action Review

## Feature Request

Replace the ASSESSMENT-state view (which previously rendered the generic `EventLogs` + BPT projector) with a purpose-built After Action Review (AAR) page. The page displays a visual timeline of every injection event from the completed game, grouped into event chains that show the full consequence arc: initial threat → player response → follow-up event → post-event mitigation.

Cards are collapsed by default (title, description, key takeaways) and expand on demand to reveal all possible responses, which ones were taken, and what budget items could have prevented the event.

## Color Coding

| Color  | Header class              | Meaning                                                          |
|--------|---------------------------|------------------------------------------------------------------|
| Black  | `aar-header--injected`    | Threat injection delivered normally                              |
| Blue   | `aar-header--prevented`   | Injection prevented by a budget item purchase                    |
| Green  | `aar-header--avoided`     | Follow-up event avoided thanks to a correct player response      |
| Red    | `aar-header--not-avoided` | Follow-up event triggered by an incorrect or missing response    |
| Orange | `aar-header--mitigation`  | Post-event mitigation applied after the follow-up was delivered  |
| Gray   | `aar-header--not-delivered` | Injection never reached (game ended before trigger time)       |

## What Was Added

### Backend

#### `src/models/aar.js` (new file)

Exports a single async function `getAARData(gameId)` that assembles the full event-chain data for a completed game in one server-side pass.

**Query sequence:**

1. `game` — fetches `id`, `poll`, `budget`, `scenario_id`.
2. `game_injection JOIN injection` — all injection rows for the game, enriched with static injection fields (`title`, `description`, `trigger_time`, `recommendations`, `poll_change`, `budget_change`, `skipper_mitigation`, `followup_injection`, etc.). The join filters on `injection.scenario_id` to handle the composite `(id, scenario_id)` primary key introduced by the multi-scenario migration.
3. `injection_response JOIN response` — all possible responses for the scenario, indexed by `injection_id`. Also filtered by `scenario_id`.
4. `game_mitigation JOIN mitigation` — purchased/unpurchased mitigations for the game, enriched with `description`, `cost`, `category`.
5. `game_log WHERE type = 'Budget Item Purchase'` — purchase timestamps, used to display when a mitigation was bought.

**Chain building:**

- Injections that are `followup_injection` targets of another injection are excluded from the top-level list.
- Top-level injections are sorted by `trigger_time`.
- Each chain entry is built by `buildChainEntry()`, which computes:
  - `category`: `'injected' | 'prevented' | 'not_delivered'`
  - `skipper_mitigation`: the mitigation that prevents this event (description, purchased state, purchase timestamp)
  - `responses_made`: enriched from `predefined_responses_made[]` — each entry includes `description`, `cost`, `mitigation_id`, and `mitigation_description` (looked up from `gmByMitigationId`)
  - `followup`: the follow-up injection chain entry (same shape, nested one level deep)

**Return value:**
```json
{
  "game": { "id": "...", "poll": 52, "budget": 2500, "scenario_id": 1 },
  "chains": [ /* AARChain[] ordered by trigger_time */ ],
  "mitigations": [ /* game_mitigation rows */ ]
}
```

#### `src/app.js`

Added `GET /games/:gameId/aar` route:

```js
const { getAARData } = require('./models/aar');

app.get('/games/:gameId/aar', asyncRoute(async (req, res) => {
  const data = await getAARData(req.params.gameId);
  res.json(data);
}));
```

Returns 404 with `{ error: 'GAME_NOT_FOUND' }` if the game ID does not exist. All other errors fall through to the existing error handler middleware.

---

### Frontend

All new components live under `src/components/AfterActionReview/`.

#### `AfterActionReview.jsx` (page container)

- Wrapped with `view()` from `@risingstack/react-easy-state` to reactively read `gameStore.id`.
- Calls `GET ${REACT_APP_API_URL}/games/${gameId}/aar` via axios on mount.
- Renders a spinner while loading, an `<Alert variant="danger">` on error, or the assembled page on success.
- The page header displays the game ID, final budget, and final support percentage.
- Passes `data.chains` to `<AARTimeline>`.
- No socket dependency — pure REST, read-only.

#### `AARTimeline.jsx`

Receives `chains[]` and renders one `<AAREventChain>` per entry. Shows a "No injection events recorded" message when the array is empty.

#### `AAREventChain.jsx`

The unit of composition for a single injection and its consequences:

1. Always renders `<AAREventCard>` for the parent injection.
2. If `category === 'injected'` and the chain has a `followup`:
   - Renders `<AARResponseIndicator>` — the connector showing what the player did (correct/incorrect/no response) between the parent card and the follow-up.
   - Renders `<AARFollowupCard>` — the follow-up event card plus, if applicable, the mitigation connector and orange card.

The `responseName` passed to `AARResponseIndicator` is taken from `responses_made[0].description`, falling back to `custom_response`.

#### `AAREventCard.jsx`

Collapsible card for the parent injection. State: `expanded` (boolean, default `false`).

**Header:**
- Time: `delivered_at` (if injected), `prevented_at` (if prevented), or `trigger_time` as fallback — formatted as `MM:SS` from milliseconds.
- Label: `THREAT INJECTED` / `EVENT PREVENTED thanks to... {MITIGATION}` / `NOT REACHED`.
- Background color driven by `aar-header--{category}` CSS class.

**Collapsed body:**
- Bold title
- Gray description
- "Key Takeaways:" section — `recommendations` text split on `\n` into bullet points
- `+ Expand` toggle button (bottom-right)

**Expanded body:**
- Everything above plus `<AARExpandedDetails>` and a `− Collapse` toggle.

#### `AARExpandedDetails.jsx`

Shown inside `<AAREventCard>` when expanded.

- **Actions to prevent event** — lists all `possible_responses`. A response in `responses_made[]` receives the `.aar-action-taken` CSS class (green text) and an "action taken" suffix.
- **Policy or tech to prevent worst impacts** — shown only when `skipper_mitigation` is present. Displays the mitigation description; if purchased, shows "✓ purchased at MM:SS".

#### `AARResponseIndicator.jsx`

The visual connector between the parent card and the follow-up card.

- Renders two downward-facing `‹‹` chevrons (via `transform: rotate(90deg)` in CSS), the icon badge, and descriptive text.
- `is_response_correct === true` → green `BsHandThumbsUp` badge + "Correct response: {name}"
- `is_response_correct === false` → red `BsHandThumbsDown` badge + "Incorrect response: {name}"
- No response made → red thumbs-down + "Incorrect response: No response"

#### `AARFollowupCard.jsx`

Handles three visual states for the follow-up injection:

| State | Condition | Card |
|-------|-----------|------|
| Avoided | `followup.prevented === true` | Green header `EVENT AVOIDED` + avoided damage label |
| Delivered | `followup.delivered === true` | Red header `FOLLOW UP EVENT` + poll/budget impact |
| Delivered + mitigated | delivered AND `responses_made.length > 0` | Red card above + mitigation connector + orange card below |

The mitigation connector (between the red and orange cards) reuses the same `.aar-connector` layout as `AARResponseIndicator`, with a green thumbs-up and "Mitigation: {RESPONSE_DESCRIPTION}".

The orange mitigation card body displays `mitigation_description` (from the response's linked mitigation row) if available, falling back to the response's own `description`. The cost is displayed right-aligned in the header as `± N USD`.

If the follow-up was neither delivered nor prevented (game ended early), `AARFollowupCard` returns `null`.

#### `Game.jsx`

Routing change — ASSESSMENT state now renders the AAR page instead of the projector:

```jsx
// Before
if (queryParams.isProjectorView || gameState === GameStates.ASSESSMENT) {
  return <Projector />;
}

// After
if (gameState === GameStates.ASSESSMENT) {
  return <AfterActionReview />;
}
if (queryParams.isProjectorView) {
  return <Projector />;
}
```

The projector view remains available during SIMULATION via `?isProjectorView=true`.

#### `src/index.scss`

Added an `// After Action Review (AAR)` section with:

- `.aar-page` — max-width container (780 px).
- `.aar-timeline` — vertical flex column with `gap: 2rem` between chains.
- `.aar-event-chain` — flex column that stacks card → connector → followup card.
- `.aar-card` — the shared card shell: border, border-radius, hover shadow, `overflow: hidden`.
- `.aar-card__header` — uppercase, bold, small font; time + label + optional right-aligned impact.
- `.aar-header--{variant}` — the six background-color classes (black / blue / green / red / orange / gray).
- `.aar-connector` — centered flex column; `__chevrons` rotate `‹‹` 90° to point downward; `__icon-badge` is a 1.75 rem circle (green or red).
- `.aar-followup__impact` — pushed to the right via `margin-left: auto` in the flex header.
- `.aar-expanded` — padded section inside an expanded card; `__list` indents action items; `.aar-action-taken` colors taken actions green.

## Data Flow

```
Game finishes (state → ASSESSMENT)
  └─ Game.jsx renders <AfterActionReview />
       └─ axios GET /games/:gameId/aar
            └─ getAARData() joins 5 tables, builds chains[]
       └─ AARTimeline renders chains[] in trigger_time order
            └─ AAREventChain per chain
                 ├─ AAREventCard (parent injection, collapsed by default)
                 ├─ AARResponseIndicator (correct / incorrect / no response)
                 └─ AARFollowupCard
                      ├─ green card  (prevented)
                      ├─ red card    (delivered)
                      └─ orange card (post-event mitigation, if responses_made)
```

## Event Chain Classification

```
injection.prevented
  → BLUE card: "EVENT PREVENTED thanks to... {mitigation}"

injection.delivered
  → BLACK card: "THREAT INJECTED"

  injection has followup_injection?
    is_response_correct === true
      → GREEN connector + GREEN followup: "EVENT AVOIDED"

    is_response_correct === false / null
      → RED connector + RED followup: "FOLLOW UP EVENT"

      followup.responses_made.length > 0
        → GREEN mitigation connector + ORANGE card: "THREAT MITIGATION"

neither delivered nor prevented
  → GRAY card: "NOT REACHED" (followup omitted)
```

## Caveats

### Composite PK joins

The `injection`, `mitigation`, `response`, `action`, and `curveball` tables use composite `(id, scenario_id)` primary keys since the multi-scenario migration (`20260330000200`). All joins in `getAARData` add an explicit `scenario_id` filter in the `WHERE` clause rather than the `ON` clause, which is safe because `game_injection.injection_id` values are seeded exclusively from the game's own scenario. If two scenarios ever share Airtable record IDs the WHERE filter is the only guard — the FK between `game_injection.injection_id` and `injection.id` was dropped by that same migration.

### `recommendations` formatting

The `recommendations` column is a free-text string stored as-is from Airtable. `AAREventCard` splits on `\n` to render bullet points. If the Airtable field uses a different line separator (e.g. `\r\n`) the bullets may not render correctly. A `.trim()` pass is applied to each segment to absorb trailing whitespace.

### Mitigation description fallback

The orange mitigation card prefers `mitigation_description` (the linked mitigation row's description) over `response.description`. If the response has no `mitigation_id`, only `response.description` is available. Both fields are resolved server-side in `buildResponsesMade()` to avoid a client-side lookup against the `mitigations[]` array.

### No socket dependency

`AfterActionReview` makes a single REST call on mount and does not subscribe to the `gameUpdated` socket event. If a facilitator somehow modifies game state after ASSESSMENT is reached, the AAR page will not reflect those changes without a manual refresh. This is intentional — ASSESSMENT is a terminal state.

### Projector view in ASSESSMENT

The Projector component is no longer rendered in ASSESSMENT state. If a second screen using `?isProjectorView=true` is still connected when the game finishes, it will now show the AAR page rather than the projector layout. This is consistent with the spec but may require facilitator communication if projector use in ASSESSMENT was previously relied upon.
