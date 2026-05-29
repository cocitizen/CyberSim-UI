import React from 'react';
import AAREventChain from './AAREventChain';

export default function AARPrepSection({ chains }) {
  if (!chains || chains.length === 0) return null;

  return (
    <div className="aar-prep-section">
      <h5 className="aar-section-heading">
        Events Prevented by Initial Budget Choices
      </h5>
      <div className="aar-timeline">
        {chains.map((chain) => (
          <AAREventChain key={chain.injection_id} chain={chain} />
        ))}
      </div>
    </div>
  );
}
