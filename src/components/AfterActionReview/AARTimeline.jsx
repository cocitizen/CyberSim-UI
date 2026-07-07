import React from 'react';
import AAREventChain from './AAREventChain';

export default function AARTimeline({ chains, hasEvents, onClearFilters }) {
  if (!chains || chains.length === 0) {
    // There are events, but the current filters hid them all.
    if (hasEvents) {
      return (
        <p className="text-muted">
          No events match the current filters.{' '}
          <button
            type="button"
            className="cs-aar-textbtn"
            onClick={onClearFilters}
          >
            Clear filters
          </button>{' '}
          to see all events.
        </p>
      );
    }
    return (
      <p className="text-muted">No events recorded for this game.</p>
    );
  }

  return (
    <div>
      <h5 className="aar-section-heading">Game event timeline</h5>
      <div className="aar-timeline">
        {chains.map((chain) => (
          <AAREventChain key={chain.injection_id} chain={chain} />
        ))}
      </div>
    </div>
  );
}
