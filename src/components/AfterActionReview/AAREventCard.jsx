import React, { useState } from 'react';
import AARExpandedDetails from './AARExpandedDetails';

function formatMs(ms) {
  if (ms == null) return '??:??';
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(
    2,
    '0',
  )}`;
}

function parseRecommendations(text) {
  if (!text) return [];
  return text
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function AAREventCard({ chain }) {
  const [expanded, setExpanded] = useState(false);

  const {
    category,
    delivered_at,
    trigger_time,
    title,
    description,
    recommendations,
    skipper_mitigation,
  } = chain;

  const time = formatMs(
    category === 'injected'
      ? delivered_at ?? trigger_time
      : trigger_time,
  );

  let headerClass = 'aar-header--injected';
  let headerLabel = 'THREAT INJECTED';

  if (category === 'prevented') {
    headerClass = 'aar-header--prevented';
    headerLabel = skipper_mitigation?.description
      ? `EVENT PREVENTED via ${skipper_mitigation.description.toUpperCase()}`
      : 'EVENT PREVENTED';
  } else if (category === 'not_delivered') {
    headerClass = 'aar-header--not-delivered';
    headerLabel = 'NOT REACHED';
  }

  const bullets = parseRecommendations(recommendations);

  return (
    <div className="aar-card">
      <div className={`aar-card__header ${headerClass}`}>
        <span className="aar-card__time">{time}</span>
        <span className="aar-card__header-label">
          {' '}
          — {headerLabel}
        </span>
      </div>
      <div className="aar-card__body">
        <p className="aar-card__title">{title}</p>
        {description && (
          <p className="aar-card__description">{description}</p>
        )}
        {bullets.length > 0 && (
          <div className="aar-card__takeaways">
            <p className="aar-card__takeaways-heading">
              Key Takeaways:
            </p>
            <ul className="aar-card__takeaways-list">
              {bullets.map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
          </div>
        )}
        {expanded && <AARExpandedDetails chain={chain} />}
        <div className="aar-card__footer">
          <button
            className="aar-card__expand-toggle"
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? '− Collapse' : '+ Expand'}
          </button>
        </div>
      </div>
    </div>
  );
}
