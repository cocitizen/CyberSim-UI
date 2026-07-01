import React, { useMemo } from 'react';
import { view } from '@risingstack/react-easy-state';

import SystemRelatedActions from './SystemRelatedActions';
import ResolvedInjections from './Injections/ResolvedInjections';
import InjectsAndResponses from './Injections/InjectsAndResponses';
import { gameStore } from '../GameStore';
import { useStaticData } from '../StaticDataProvider';
import useTimeTaken from '../../hooks/useTimeTaken';
import { partitionFacilitatorEvents } from '../../util/facilitatorEvents';

const FacilitatorTable = view(() => {
  const { injections: gameInjections } = gameStore;
  const { injections } = useStaticData();
  const timeTaken = useTimeTaken();

  const { injectionsToResponse, resolvedInjections } = useMemo(
    () =>
      partitionFacilitatorEvents({
        injections,
        gameInjections,
        timeTaken,
      }),
    [injections, gameInjections, timeTaken],
  );

  return (
    <>
      <InjectsAndResponses
        className="my-4"
        injectionsToResponse={injectionsToResponse}
      />
      <SystemRelatedActions className="my-4" />
      <ResolvedInjections
        className="my-4"
        resolvedInjections={resolvedInjections}
      />
    </>
  );
});

export default FacilitatorTable;
