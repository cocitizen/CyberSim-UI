import React from 'react';
import { BsCheckCircle } from 'react-icons/bs';
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

function ImpactLabel({ pollChange, budgetChange }) {
  const parts = [];
  if (pollChange != null && pollChange !== 0) {
    parts.push(`POLLS: ${pollChange > 0 ? '+' : ''}${pollChange}%`);
  }
  if (budgetChange != null && budgetChange !== 0) {
    parts.push(`${budgetChange > 0 ? '+' : ''}$${budgetChange}`);
  }
  if (parts.length === 0) return null;
  return (
    <span className="aar-followup__impact">{parts.join(' / ')}</span>
  );
}

export default function AARFollowupCard({
  followup,
  parentPrevented,
}) {
  const { systems } = useStaticData();

  if (!followup) return null;

  const {
    title,
    description,
    delivered,
    delivered_at,
    prevented,
    prevented_at,
    trigger_time,
    poll_change,
    budget_change,
    systems_to_disable,
    responses_made,
    skipper_mitigation,
  } = followup;

  const disabledSystemNames = systems_to_disable?.length
    ? systems_to_disable.map((id) => systems[id]?.name ?? id)
    : [];

  const hasMitigation =
    delivered && responses_made && responses_made.length > 0;
  const mitigationResponse = hasMitigation ? responses_made[0] : null;

  // Parent injection was prevented by a budget-item purchase.  The follow-up
  // never had a chance to trigger, so its own delivered/prevented flags are
  // both false.  Render it as a blue EVENT PREVENTED card to show that the
  // entire chain was avoided thanks to the prep-phase purchase.
  if (parentPrevented) {
    const time = formatMs(trigger_time);
    return (
      <div className="aar-card">
        <div className="aar-card__header aar-header--prevented">
          <span className="aar-card__time">{time}</span>
          <span className="aar-card__header-label">
            {' '}
            — EVENT PREVENTED
          </span>
          {poll_change != null && poll_change !== 0 && (
            <span className="aar-followup__impact aar-followup__impact--right">
              AVOIDED DAMAGE: {poll_change > 0 ? '+' : ''}
              {poll_change}%
            </span>
          )}
        </div>
        <div className="aar-card__body">
          <p className="aar-card__title">{title}</p>
          {description && (
            <p className="aar-card__description">{description}</p>
          )}
        </div>
      </div>
    );
  }

  if (prevented) {
    // Green: follow-up avoided
    const time = formatMs(prevented_at ?? trigger_time);
    return (
      <div className="aar-card">
        <div className="aar-card__header aar-header--avoided">
          <span className="aar-card__time">{time}</span>
          <span className="aar-card__header-label">
            {' '}
            —{' '}
            {skipper_mitigation?.description
              ? `EVENT AVOIDED via ${skipper_mitigation.description.toUpperCase()}`
              : 'EVENT AVOIDED'}
          </span>
          {(poll_change != null || budget_change != null) && (
            <span className="aar-followup__impact aar-followup__impact--right">
              {poll_change != null &&
                poll_change !== 0 &&
                `AVOIDED DAMAGE: ${
                  poll_change > 0 ? '+' : ''
                }${poll_change}%`}
            </span>
          )}
        </div>
        <div className="aar-card__body">
          <p className="aar-card__title">{title}</p>
          {description && (
            <p className="aar-card__description">{description}</p>
          )}
          {disabledSystemNames.length > 0 && (
            <p className="aar-card__systems-disabled">
              <strong>Systems that would have been disabled:</strong>{' '}
              {disabledSystemNames.join(', ')}
            </p>
          )}
        </div>
      </div>
    );
  }

  if (delivered) {
    // Red: follow-up delivered
    const time = formatMs(delivered_at ?? trigger_time);
    return (
      <>
        <div className="aar-card">
          <div className="aar-card__header aar-header--not-avoided">
            <span className="aar-card__time">{time}</span>
            <span className="aar-card__header-label">
              {' '}
              — FOLLOW UP EVENT
            </span>
            <ImpactLabel
              pollChange={poll_change}
              budgetChange={budget_change}
            />
          </div>
          <div className="aar-card__body">
            <p className="aar-card__title">{title}</p>
            {description && (
              <p className="aar-card__description">{description}</p>
            )}
            {disabledSystemNames.length > 0 && (
              <p className="aar-card__systems-disabled">
                <strong>Systems disabled:</strong>{' '}
                {disabledSystemNames.join(', ')}
              </p>
            )}
          </div>
        </div>

        {hasMitigation && (
          <>
            {/* Mitigation connector */}
            <div className="aar-connector">
              <div className="aar-connector__chevrons">
                &#8249;&#8249;
              </div>
              <div className="aar-connector__indicator">
                <span className="aar-connector__icon-badge aar-connector__icon-badge--green">
                  <BsCheckCircle />
                </span>
                <span className="aar-connector__text">
                  Mitigation:{' '}
                  <strong>
                    {(
                      mitigationResponse.description || ''
                    ).toUpperCase()}
                  </strong>
                </span>
              </div>
              <div className="aar-connector__chevrons">
                &#8249;&#8249;
              </div>
            </div>

            {/* Orange mitigation card */}
            <div className="aar-card">
              <div className="aar-card__header aar-header--mitigation">
                <span className="aar-card__time">
                  {formatMs(
                    followup.response_made_at ?? delivered_at,
                  )}
                </span>
                <span className="aar-card__header-label">
                  {' '}
                  — THREAT MITIGATION
                </span>
                {mitigationResponse.cost != null && (
                  <span className="aar-followup__impact aar-followup__impact--right">
                    {mitigationResponse.cost > 0 ? '-' : '+'}{' '}
                    ${Math.abs(mitigationResponse.cost)}
                  </span>
                )}
              </div>
              <div className="aar-card__body">
                <p className="aar-card__title">
                  {mitigationResponse.mitigation_description ||
                    mitigationResponse.description}
                </p>
              </div>
            </div>
          </>
        )}
      </>
    );
  }

  // Not yet delivered (game ended early or not tracked) — show as not-reached
  const time = formatMs(trigger_time);
  return (
    <div className="aar-card">
      <div className="aar-card__header aar-header--not-delivered">
        <span className="aar-card__time">{time}</span>
        <span className="aar-card__header-label"> — NOT REACHED</span>
      </div>
      <div className="aar-card__body">
        <p className="aar-card__title">{title}</p>
        {description && (
          <p className="aar-card__description">{description}</p>
        )}
      </div>
    </div>
  );
}
