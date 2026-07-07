import React, { useMemo, useState } from 'react';
import { view } from '@risingstack/react-easy-state';
import { BsBuilding, BsHouseDoor } from 'react-icons/bs';
import { FiLayers } from 'react-icons/fi';

import SystemRelatedActions from './SystemRelatedActions';
import ResolvedInjections from './Injections/ResolvedInjections';
import InjectsAndResponses from './Injections/InjectsAndResponses';
import { gameStore } from '../GameStore';
import { useStaticData } from '../StaticDataProvider';
import useTimeTaken from '../../hooks/useTimeTaken';
import { partitionFacilitatorEvents } from '../../util/facilitatorEvents';

// Persisted per-client (this is a display preference, not shared game state):
// with two facilitators each can scope the live events feed to their location.
const FILTER_KEY = 'eventsLocationFilter';

const FacilitatorTable = view(() => {
  const { injections: gameInjections } = gameStore;
  const { injections, getLocationNameByType } = useStaticData();
  const timeTaken = useTimeTaken();

  const [locationFilter, setLocationFilter] = useState(
    () => localStorage.getItem(FILTER_KEY) || 'all',
  );
  const changeFilter = (value) => {
    setLocationFilter(value);
    localStorage.setItem(FILTER_KEY, value);
  };

  const { injectionsToResponse, resolvedInjections } = useMemo(
    () =>
      partitionFacilitatorEvents({
        injections,
        gameInjections,
        timeTaken,
      }),
    [injections, gameInjections, timeTaken],
  );

  // Which specific locations actually have events. Only offer the filter when
  // there are at least two to choose between — a single-location scenario has
  // nothing to separate.
  const presentLocations = useMemo(() => {
    const set = new Set();
    Object.values(injections || {}).forEach((injection) => {
      if (injection.location) set.add(injection.location);
    });
    return set;
  }, [injections]);

  const filterOptions = useMemo(() => {
    if (presentLocations.size < 2) return [];
    const options = [{ key: 'all', label: 'All', Icon: FiLayers }];
    if (presentLocations.has('hq')) {
      options.push({
        key: 'hq',
        label: getLocationNameByType('hq', 'HQ'),
        Icon: BsBuilding,
      });
    }
    if (presentLocations.has('local')) {
      options.push({
        key: 'local',
        label: getLocationNameByType('local', 'Local'),
        Icon: BsHouseDoor,
      });
    }
    return options;
  }, [presentLocations, getLocationNameByType]);

  // Guard a stale persisted value (e.g. switching to a scenario without that
  // location) by falling back to "all".
  const activeFilter =
    locationFilter !== 'all' && !presentLocations.has(locationFilter)
      ? 'all'
      : locationFilter;

  // Only the live events feed is filtered — System Restore and Resolved stay
  // full. Shared (no-location) events show under every location, matching the
  // pre-merge two-tab behaviour.
  const visibleInjectionsToResponse = useMemo(() => {
    if (activeFilter === 'all') return injectionsToResponse;
    return injectionsToResponse.filter(
      ({ injection }) =>
        injection.location === activeFilter || !injection.location,
    );
  }, [injectionsToResponse, activeFilter]);

  return (
    <>
      <InjectsAndResponses
        className="my-4"
        injectionsToResponse={visibleInjectionsToResponse}
        filterOptions={filterOptions}
        activeFilter={activeFilter}
        onFilterChange={changeFilter}
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
