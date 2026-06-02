import React, { useMemo } from 'react';
import { view } from '@risingstack/react-easy-state';
import _reduce from 'lodash/reduce';
import _map from 'lodash/map';

import { gameStore } from '../GameStore';
import { useStaticData } from '../StaticDataProvider';

const PurchasedMitigations = view(() => {
  const { mitigations: staticMitigations } = useStaticData();
  const { mitigations: gameMitigations } = gameStore;

  const purchased = useMemo(
    () =>
      Object.entries(gameMitigations)
        .filter(([, state]) => state) // only purchased ones, during the game.
        .map(([id]) => staticMitigations[id]) // find matching static mitigations entries.
        .filter((foundMitigation) => foundMitigation), // only defined values.
    [gameMitigations, staticMitigations],
  );

  const byCategory = useMemo(
    () =>
      _reduce(
        purchased,
        (acc, mitigation) => ({
          ...acc,
          [mitigation.category]: [
            ...(acc[mitigation.category] || []),
            mitigation,
          ],
        }),
        {},
      ),
    [purchased],
  );

  if (purchased.length === 0) {
    return (
      <p className="text-muted mb-0">
        No budget items purchased yet.
      </p>
    );
  }

  return (
    <div className="purchased-mitigations">
      {_map(byCategory, (purchasedMitigations, category) => (
        <div key={category} className="mb-3">
          <h6 className="text-uppercase text-muted small mb-1">
            {category}
          </h6>
          <ul className="list-unstyled mb-0">
            {purchasedMitigations.map((mitigation) => (
              <li
                key={mitigation.id}
                className="d-flex justify-content-between"
              >
                <span>{mitigation.description}</span>
                <span className="text-nowrap ml-2 text-success">
                  ${mitigation.cost.toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
});

export default PurchasedMitigations;
