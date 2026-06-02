import React from 'react';

function parseRecommendations(text) {
  if (!text) return [];
  return text
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function AARExpandedDetails({ chain }) {
  const {
    possible_responses,
    responses_made,
    skipper_mitigation,
    recommendations,
    followup,
  } = chain;

  const bullets = parseRecommendations(recommendations);

  const madeIds = new Set(
    (responses_made || []).map((r) => r.response_id),
  );

  return (
    <div className="aar-expanded">
      <div className="aar-expanded__section">
        <p className="aar-expanded__heading">
          Budget item to prevent event:
        </p>
        <ul className="aar-expanded__list">
          {skipper_mitigation ? (
            <li
              className={
                skipper_mitigation.purchased
                  ? 'aar-action-taken'
                  : undefined
              }
            >
              {skipper_mitigation.description || 'None'}
              {skipper_mitigation.purchased && (
                <span className="aar-expanded__taken-label">
                  {' '}
                  ✓ purchased
                  {skipper_mitigation.purchased_in_preparation
                    ? ' in preparation'
                    : skipper_mitigation.purchased_at != null
                    ? ` at ${formatMs(
                        skipper_mitigation.purchased_at,
                      )}`
                    : ''}
                </span>
              )}
            </li>
          ) : (
            <li>None</li>
          )}
        </ul>
      </div>

      {possible_responses && possible_responses.length > 0 && (
        <div className="aar-expanded__section">
          <p className="aar-expanded__heading">
            {followup
              ? 'Actions to prevent follow-up event:'
              : 'Actions to mitigate impact:'}
          </p>
          <ul className="aar-expanded__list">
            {possible_responses.map((resp) => {
              const taken = madeIds.has(resp.id);
              return (
                <li
                  key={resp.id}
                  className={taken ? 'aar-action-taken' : undefined}
                >
                  {resp.description}
                  {taken && (
                    <span className="aar-expanded__taken-label">
                      {' '}
                      - action taken
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {bullets.length > 0 && (
        <div className="aar-expanded__section">
          <p className="aar-expanded__heading">Key Takeaways:</p>
          <ul className="aar-expanded__list">
            {bullets.map((b, i) => (
              <li key={i}>{b}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function formatMs(ms) {
  if (ms == null) return '';
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(
    2,
    '0',
  )}`;
}
