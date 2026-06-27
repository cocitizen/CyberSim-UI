import React, { useMemo } from 'react';
import { reduce as _reduce, map as _map } from 'lodash';
import { view } from '@risingstack/react-easy-state';
import classNames from 'classnames';
import { FiBriefcase, FiMapPin } from 'react-icons/fi';

import AvailableActionItems from './AvailableActionItems';
import NotAvailableActionItems from './NotAvailableActionItems';
import { gameStore } from '../GameStore';
import { useStaticData } from '../StaticDataProvider';

const ActionItems = view(({ className, location }) => {
  const { systems: gameSystems } = gameStore;
  const { actions, systems, getLocationNameByType } = useStaticData();

  const actionListByRoles = useMemo(() => {
    const actionsWithSystems = _map(actions, (action) => {
      action.unavailableSystems = (action.required_systems || []).filter(
        (system) => !gameSystems[system],
      );
      return action;
    });

    return _reduce(
      actionsWithSystems,
      (result, action) => {
        if (action.type !== location) {
          return result;
        }

        const actionAvailability =
          action.unavailableSystems.length === 0
            ? 'available'
            : 'notAvailable';

        (action.roles || []).forEach((role) => {
          (result[role] ||
            (result[role] = { available: [], notAvailable: [] }))[
            actionAvailability
          ].push(action);
        });

        return result;
      },
      {},
    );
  }, [actions, gameSystems, location]);

  const isLocal = location === 'local';
  const locationName = getLocationNameByType(
    location,
    isLocal ? 'Local' : 'HQ',
  );
  const title = isLocal
    ? `${locationName} actions`
    : `${locationName} actions & security`;
  const Icon = isLocal ? FiMapPin : FiBriefcase;

  return (
    <section
      className={classNames('cs-card', className)}
      id={`${location}_actions`}
    >
      <div className="cs-card__head">
        <div className="cs-card__heading">
          <span className="cs-card__icon" aria-hidden="true">
            <Icon />
          </span>
          <h2 className="cs-section-title">{title}</h2>
        </div>
      </div>
      {_map(actionListByRoles, (roleActions, role) => (
        <div className="cs-role" key={role}>
          <h4 className="cs-role__title">{role}</h4>
          <AvailableActionItems
            actionList={roleActions.available}
            role={role}
          />
          <NotAvailableActionItems
            systems={systems}
            actionList={roleActions.notAvailable}
            role={role}
          />
        </div>
      ))}
    </section>
  );
});

export default ActionItems;
