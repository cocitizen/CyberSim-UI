import React from 'react';
import AAREventChain from './AAREventChain';

export default function AARTimeline({ chains }) {
  if (!chains || chains.length === 0) {
    return <p className="text-muted">No injection events recorded for this game.</p>;
  }

  return (
    <div>
      <h5 className="aar-section-heading">Game Event Timeline</h5>
      <div className="aar-timeline">
        {chains.map((chain) => (
          <AAREventChain key={chain.injection_id} chain={chain} />
        ))}
      </div>
    </div>
  );
}
