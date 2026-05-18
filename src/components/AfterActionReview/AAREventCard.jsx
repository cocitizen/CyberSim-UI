import React, { useState } from 'react';
import AARExpandedDetails from './AARExpandedDetails';
import { useStaticData } from '../StaticDataProvider';

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

export default function AAREventCard({ chain }) {
  const [expanded, setExpanded] = useState(false);
  const { systems } = useStaticData();

  const {
    category,
    delivered_at,
    trigger_time,
    title,
    description,
    skipper_mitigation,
    poll_change,
    budget_change,
    systems_to_disable,
  } = chain;

  const time = formatMs(
    category === 'injected'
      ? delivered_at ?? trigger_time
      : trigger_time,
  );

  let headerClass = 'aar-header--injected';
  let headerLabel = 'EVENT';

  if (category === 'prevented') {
    headerClass = 'aar-header--prevented';
    headerLabel = skipper_mitigation?.description
      ? `EVENT PREVENTED via ${skipper_mitigation.description.toUpperCase()}`
      : 'EVENT PREVENTED';
  } else if (category === 'not_delivered') {
    headerClass = 'aar-header--not-delivered';
    headerLabel = 'NOT REACHED';
  }

  const injectedSystemNames =
    category === 'injected' && systems_to_disable?.length
      ? systems_to_disable.map((id) => systems[id]?.name ?? id)
      : [];

  const showImpact =
    category === 'injected' &&
    ((poll_change != null && poll_change !== 0) ||
      (budget_change != null && budget_change !== 0));

  return (
    <div className="aar-card">
      <div className={`aar-card__header ${headerClass}`}>
        <span className="aar-card__time">{time} —</span>
        <span className="aar-card__header-label">{headerLabel}</span>
        {showImpact && (
          <span className="aar-followup__impact aar-followup__impact--right">
            {' '}
            {poll_change != null && poll_change !== 0
              ? `POLLS: ${poll_change > 0 ? '+' : ''}${poll_change}%`
              : ''}
            {poll_change != null &&
            poll_change !== 0 &&
            budget_change != null &&
            budget_change !== 0
              ? ' / '
              : ''}
            {budget_change != null && budget_change !== 0
              ? `${budget_change > 0 ? '+' : ''}$${budget_change}`
              : ''}
          </span>
        )}
      </div>
      <div className="aar-card__body">
        <p className="aar-card__title">{title}</p>
        {description && (
          <p className="aar-card__description">{description}</p>
        )}
        {injectedSystemNames.length > 0 && (
          <p className="aar-card__systems-disabled">
            <strong>Systems disabled:</strong>{' '}
            {injectedSystemNames.join(', ')}
          </p>
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
