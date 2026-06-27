import React, { useMemo, useState } from 'react';
import {
  Button,
  ToggleButtonGroup,
  ToggleButton,
} from 'react-bootstrap';
import { view, store } from '@risingstack/react-easy-state';
import { orderBy as _orderBy, reduce as _reduce } from 'lodash';
import classNames from 'classnames';
import { FiFileText } from 'react-icons/fi';

import { useStaticData } from '../StaticDataProvider';
import { gameStore } from '../GameStore';
import EventLogSwitch from './EventLogSwitch';
import PreparationsLog from './PreparationsLog';

export const accordionOpeners = store([]);

export const logTypes = {
  Preparations: 'Preparations',
  BudgetItem: 'Budget Item Purchase',
  SystemRestore: 'System Restore Action',
  CampaignAction: 'Campaign Action',
  ThreatInjected: 'Threat Injected',
  ThreatPrevented: 'Threat Prevented',
  GameState: 'Game State Changed',
  CurveballEvent: 'Curveball Event',
};

const EventLogs = view(({ className, asc = true }) => {
  const { logs: gameLogs, injections: gameInjections } = gameStore;
  const { injections } = useStaticData();

  const logs = useMemo(() => {
    const preventedLogs = _reduce(
      gameInjections,
      (acc, { injection_id, prevented, prevented_at }) => {
        if (prevented) {
          acc.push({
            type: 'Threat Prevented',
            injection: injections[injection_id],
            game_timer: prevented_at,
            id: `injection_${injection_id}`,
          });
        }
        return acc;
      },
      [],
    );
    const injectionLogs = _reduce(
      gameInjections,
      (acc, gameInjection) => {
        if (gameInjection.delivered) {
          acc.push({
            type: 'Threat Injected',
            injection: injections[gameInjection.injection_id],
            gameInjection,
            game_timer: gameInjection.delivered_at,
            id: `injection_${gameInjection.injection_id}`,
          });
        }
        return acc;
      },
      [],
    );
    return _orderBy(
      [...preventedLogs, ...injectionLogs, ...(gameLogs || [])],
      'game_timer',
      asc ? 'asc' : 'desc',
    );
  }, [gameInjections, injections, gameLogs, asc]);

  const [filterValue, setFilterValue] = useState(
    Object.values(logTypes),
  );
  const filter = useMemo(
    () =>
      filterValue.reduce(
        (acc, logType) => ({ ...acc, [logType]: true }),
        {},
      ),
    [filterValue],
  );

  return (
    <section className={classNames('cs-card', className)} id="logs">
      <div className="cs-card__head">
        <div className="cs-card__heading">
          <span className="cs-card__icon" aria-hidden="true">
            <FiFileText />
          </span>
          <h2 className="cs-section-title">Events log</h2>
        </div>
        <div className="d-flex flex-wrap" style={{ gap: '0.4rem' }}>
          <Button
            variant="outline-primary"
            size="sm"
            className="rounded-pill"
            type="button"
            style={{ whiteSpace: 'nowrap' }}
            onClick={() => setFilterValue(Object.values(logTypes))}
          >
            Show all
          </Button>
          <Button
            variant="outline-primary"
            size="sm"
            className="rounded-pill"
            type="button"
            onClick={() => setFilterValue([])}
          >
            Hide all
          </Button>
          <Button
            variant="outline-primary"
            size="sm"
            className="rounded-pill"
            type="button"
            style={{ whiteSpace: 'nowrap' }}
            onClick={() =>
              accordionOpeners.forEach((openAccordion) =>
                openAccordion(false),
              )
            }
          >
            Close all
          </Button>
          <Button
            variant="outline-primary"
            size="sm"
            className="rounded-pill"
            type="button"
            style={{ whiteSpace: 'nowrap' }}
            onClick={() =>
              accordionOpeners.forEach((openAccordion) =>
                openAccordion(true),
              )
            }
          >
            Expand all
          </Button>
        </div>
      </div>

      <ToggleButtonGroup
        type="checkbox"
        value={filterValue}
        onChange={setFilterValue}
        className="d-flex flex-wrap log-filter mb-3"
        style={{ zIndex: 0, gap: '0.25rem' }}
      >
        <ToggleButton
          value={logTypes.Preparations}
          variant="outline-primary"
          className="p-1 d-flex align-items-center justify-content-center rounded"
        >
          {logTypes.Preparations}
        </ToggleButton>
        <ToggleButton
          value={logTypes.BudgetItem}
          variant="outline-primary"
          className="p-1 d-flex align-items-center justify-content-center rounded"
        >
          {logTypes.BudgetItem}
        </ToggleButton>
        <ToggleButton
          value={logTypes.SystemRestore}
          variant="outline-primary"
          className="p-1 d-flex align-items-center justify-content-center rounded"
        >
          {logTypes.SystemRestore}
        </ToggleButton>
        <ToggleButton
          value={logTypes.CampaignAction}
          variant="outline-primary"
          className="p-1 d-flex align-items-center justify-content-center rounded"
        >
          {logTypes.CampaignAction}
        </ToggleButton>
        <ToggleButton
          value={logTypes.ThreatInjected}
          variant="outline-primary"
          className="p-1 d-flex align-items-center justify-content-center rounded"
        >
          {logTypes.ThreatInjected}
        </ToggleButton>
        <ToggleButton
          value={logTypes.ThreatPrevented}
          variant="outline-primary"
          className="p-1 d-flex align-items-center justify-content-center rounded"
        >
          {logTypes.ThreatPrevented}
        </ToggleButton>
        <ToggleButton
          value={logTypes.GameState}
          variant="outline-primary"
          className="p-1 d-flex align-items-center justify-content-center rounded"
        >
          {logTypes.GameState}
        </ToggleButton>
        <ToggleButton
          value={logTypes.CurveballEvent}
          variant="outline-primary"
          className="p-1 rounded"
        >
          {logTypes.CurveballEvent}
        </ToggleButton>
      </ToggleButtonGroup>

      <div>
        {filter[logTypes.Preparations] && asc && <PreparationsLog />}
        {logs.map((log) => (
          <EventLogSwitch log={log} key={log.id} filter={filter} />
        ))}
        {filter[logTypes.Preparations] && !asc && <PreparationsLog />}
      </div>
    </section>
  );
});

export default EventLogs;
