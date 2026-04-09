import React from 'react';

export default function AARExpandedDetails({ chain }) {
  const { possible_responses, responses_made, skipper_mitigation } = chain;

  const madeIds = new Set((responses_made || []).map((r) => r.response_id));

  return (
    <div className="aar-expanded">
      {possible_responses && possible_responses.length > 0 && (
        <div className="aar-expanded__section">
          <p className="aar-expanded__heading">Actions to prevent event:</p>
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
                    <span className="aar-expanded__taken-label"> action taken</span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {skipper_mitigation && (
        <div className="aar-expanded__section">
          <p className="aar-expanded__heading">Policy or tech to prevent worst impacts:</p>
          <ul className="aar-expanded__list">
            <li
              className={
                skipper_mitigation.purchased ? 'aar-action-taken' : undefined
              }
            >
              {skipper_mitigation.description}
              {skipper_mitigation.purchased && (
                <span className="aar-expanded__taken-label">
                  {' '}
                  ✓ purchased
                  {skipper_mitigation.purchased_at != null
                    ? ` at ${formatMs(skipper_mitigation.purchased_at)}`
                    : ''}
                </span>
              )}
            </li>
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
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
