import React from 'react';
import AAREventCard from './AAREventCard';
import AARResponseIndicator from './AARResponseIndicator';
import AARFollowupCard from './AARFollowupCard';

export default function AAREventChain({ chain }) {
  const { category, followup, responses_made, is_response_correct, custom_response } = chain;

  // Determine the name of the response made for the connector label
  const firstResponse = responses_made && responses_made.length > 0 ? responses_made[0] : null;
  const responseName = firstResponse?.description || custom_response || null;

  const showFollowup = category === 'injected' && followup;

  return (
    <div className="aar-event-chain">
      <AAREventCard chain={chain} />

      {showFollowup && (
        <>
          <AARResponseIndicator
            isCorrect={is_response_correct}
            responseName={responseName}
          />
          <AARFollowupCard followup={followup} />
        </>
      )}
    </div>
  );
}
