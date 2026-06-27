import React, { useMemo } from 'react';
import { filter as _filter } from 'lodash';
import { view } from '@risingstack/react-easy-state';

import SystemRelatedActions from './SystemRelatedActions';
import ResolvedInjections from './Injections/ResolvedInjections';
import InjectsAndResponses from './Injections/InjectsAndResponses';
import { SimulationTabs } from '../../constants';
import { gameStore } from '../GameStore';
import { useStaticData } from '../StaticDataProvider';
import useTimeTaken from '../../hooks/useTimeTaken';

const FacilitatorTable = view(({ activeTab }) => {
  const location = useMemo(() => {
    if (activeTab === SimulationTabs.CAMPAIGN_HQ) {
      return 'hq';
    }
    return 'local';
  }, [activeTab]);

  const { injections: gameInjections } = gameStore;
  const { injections } = useStaticData();
  const timeTaken = useTimeTaken();

  const { injectionsToResponse, resolvedInjections } = useMemo(() => {
    let injectionToDeliverFound = false;
    return _filter(
      injections,
      ({ location: injectionLocation }) =>
        injectionLocation === location || injectionLocation === null,
    ).reduce(
      (acc, injection) => {
        const gameInjection = gameInjections[injection.id] || {};
        const isBackground = injection.type === 'Background';
        const {
          delivered,
          prevented,
          response_made_at: responseMadeAt,
        } = gameInjection;
        const upcoming = timeTaken < injection.trigger_time;
        const resolved =
          timeTaken > injection.trigger_time &&
          (responseMadeAt ||
            prevented ||
            (isBackground && delivered));
        const canMakeResponse =
          !responseMadeAt && delivered && !isBackground;
        const canDeliver =
          !upcoming &&
          !delivered &&
          !injectionToDeliverFound &&
          !prevented;
        if (canDeliver) {
          injectionToDeliverFound = true;
        }
        const injectionWithParams = {
          injection,
          upcoming: timeTaken < injection.trigger_time,
          resolved,
          canDeliver,
          canMakeResponse,
          delivered,
          gameInjection,
          prevented,
          isBackground,
          isDanger:
            !canDeliver &&
            !canMakeResponse &&
            injection.trigger_time - timeTaken < 180000,
        };
        if (resolved) {
          acc.resolvedInjections.push(injectionWithParams);
        } else {
          acc.injectionsToResponse.push(injectionWithParams);
        }
        return acc;
      },
      { injectionsToResponse: [], resolvedInjections: [] },
    );
  }, [injections, location, gameInjections, timeTaken]);

  return (
    <>
      <InjectsAndResponses
        className="my-4"
        injectionsToResponse={injectionsToResponse}
      />
      <SystemRelatedActions className="my-4" location={location} />
      <ResolvedInjections
        className="my-4"
        resolvedInjections={resolvedInjections}
      />
    </>
  );
});

export default FacilitatorTable;
