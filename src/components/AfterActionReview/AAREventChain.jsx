import React from 'react';
import AAREventCard from './AAREventCard';
import AARResponseIndicator from './AARResponseIndicator';
import AARFollowupCard from './AARFollowupCard';

export default function AAREventChain({ chain }) {
  const { category, followup, responses_made, is_response_correct, response_made_at, custom_response, location } = chain;

  // Determine the name of the response made for the connector label
  const firstResponse = responses_made && responses_made.length > 0 ? responses_made[0] : null;
  const responseName = firstResponse?.description || custom_response || null;

  // Response is late if it was made after the follow-up was already delivered
  const isLate =
    is_response_correct === true &&
    response_made_at != null &&
    followup?.delivered_at != null &&
    response_made_at > followup.delivered_at;

  // Show the response indicator + follow-up card when the parent was injected and has a followup.
  const showFollowup = category === 'injected' && followup;

  // For standalone injected threats (no followup), still show the indicator if a response was made.
  const showStandaloneIndicator = category === 'injected' && !followup && responseName;

  // When the parent injection was prevented by a budget-item purchase, its
  // follow-up must also be shown as prevented (blue card).  The follow-up row
  // in game_injection will have delivered=false and prevented=false because the
  // parent chain was cut before the simulation could trigger it — so we cannot
  // rely on the follow-up's own state here; we use the parent's category instead.
  const showPreventedFollowup = category === 'prevented' && followup;

  const locationLabel = location === 'hq' ? 'HQ' : location === 'local' ? 'Local' : null;
  const categoryLabel = chain.handbook_category || null;

  return (
    <div className="aar-event-chain">
      <div className="aar-event-chain__labels">
        {locationLabel && (
          <span className={`aar-event-chain__location-label aar-event-chain__location-label--${location}`}>
            {locationLabel}
          </span>
        )}
        {categoryLabel && (
          <span className="aar-event-chain__category-label">
            {categoryLabel}
          </span>
        )}
      </div>
      <AAREventCard chain={chain} />

      {showFollowup && (
        <>
          <AARResponseIndicator
            isCorrect={is_response_correct}
            isLate={isLate}
            responseName={responseName}
          />
          <AARFollowupCard followup={followup} />
        </>
      )}

      {showStandaloneIndicator && (
        <AARResponseIndicator
          isCorrect={is_response_correct}
          responseName={responseName}
          topOnly
          grey={!(firstResponse?.systems_to_restore?.length > 0)}
          label={firstResponse?.systems_to_restore?.length > 0 ? 'System restored' : undefined}
        />
      )}

      {showPreventedFollowup && (
        <>
          <div className="aar-connector">
            <div className="aar-connector__chevrons">&#8249;&#8249;</div>
            <div className="aar-connector__indicator">
              <span className="aar-connector__text">Followup event</span>
            </div>
            <div className="aar-connector__chevrons">&#8249;&#8249;</div>
          </div>
          <AARFollowupCard followup={followup} parentPrevented />
        </>
      )}
    </div>
  );
}
