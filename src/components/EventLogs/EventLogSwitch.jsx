import React, { useMemo } from 'react';
import { view } from '@risingstack/react-easy-state';
import { Badge } from 'react-bootstrap';

import { logTypes } from './EventLogs';
import BudgetItemLog from './BudgetItemLog';
import CampaignActionLog from './CampaignActionLog';
import CurveballEventLog from './CurveballEventLog';
import SystemRestoreLog from './SystemRestoreLog';
import Log from './Log';
import InjectionBody from '../Simulation/Injections/InjectionBody';
import { msToMinutesSeconds } from '../../util';

const EventLogSwitch = view(
  ({
    log: {
      game_timer,
      description,
      type,
      mitigation_id,
      response_id,
      action_id,
      curveball_id,
      injection,
      gameInjection,
    },
    filter,
  }) => {
    const shouldDisplay = useMemo(
      () => filter[type] || false,
      [filter, type],
    );

    const eventLog = useMemo(() => {
      switch (type) {
        case logTypes.BudgetItem:
          return (
            <BudgetItemLog
              game_timer={game_timer}
              type={type}
              mitigation_id={mitigation_id}
            />
          );
        case logTypes.SystemRestore:
          return (
            <SystemRestoreLog
              game_timer={game_timer}
              type={type}
              response_id={response_id}
              action_id={action_id}
            />
          );
        case logTypes.CampaignAction:
          return (
            <CampaignActionLog
              game_timer={game_timer}
              type={type}
              action_id={action_id}
            />
          );
        case logTypes.CurveballEvent:
          return (
            <CurveballEventLog
              game_timer={game_timer}
              type={type}
              curveball_id={curveball_id}
            />
          );
        case logTypes.ThreatInjected:
          if (!injection) {
            return (
              <Log
                title={
                  <div className="d-flex align-items-center">
                    {`${msToMinutesSeconds(game_timer)} -`}{' '}
                    <Badge pill variant="danger" className="py-1 mx-1">
                      {type}
                    </Badge>
                    Unknown threat
                  </div>
                }
              />
            );
          }
          return (
            <Log
              title={
                <div className="d-flex align-items-center">
                  {`${msToMinutesSeconds(game_timer)} -`}{' '}
                  <Badge pill variant="danger" className="py-1 mx-1">
                    {type}
                  </Badge>
                  {`${
                    injection.title
                  } (available from ${msToMinutesSeconds(
                    injection.trigger_time,
                  )})`}
                  {injection.type === 'Background' && (
                    <Badge
                      pill
                      variant="primary"
                      className="py-1 mx-1"
                    >
                      BACKGROUND
                    </Badge>
                  )}
                </div>
              }
            >
              <InjectionBody
                injection={injection}
                gameInjection={gameInjection}
                isBackground={injection.type === 'Background'}
              />
            </Log>
          );
        case logTypes.ThreatPrevented:
          if (!injection) {
            return (
              <Log
                title={
                  <div className="d-flex align-items-center">
                    {`${msToMinutesSeconds(game_timer)} -`}
                    <Badge pill variant="success" className="py-1 mx-1">
                      {type}
                    </Badge>
                    Unknown threat
                  </div>
                }
              />
            );
          }
          return (
            <Log
              title={
                <div className="d-flex align-items-center">
                  {`${msToMinutesSeconds(game_timer)} -`}
                  <Badge pill variant="success" className="py-1 mx-1">
                    {type}
                  </Badge>
                  {`${
                    injection.title
                  } (triggers at ${msToMinutesSeconds(
                    injection.trigger_time,
                  )})`}
                  {injection.type === 'Background' && (
                    <Badge
                      pill
                      variant="primary"
                      className="py-1 mx-1"
                    >
                      BACKGROUND
                    </Badge>
                  )}
                </div>
              }
            >
              <InjectionBody
                injection={injection}
                prevented
                isBackground={injection.type === 'Background'}
              />
            </Log>
          );
        case logTypes.GameState:
          return (
            <Log
              title={
                <div className="d-flex align-items-center">
                  {`${msToMinutesSeconds(game_timer)} -`}
                  <Badge pill variant="primary" className="py-1 mx-1">
                    {type}
                  </Badge>
                  {description}
                </div>
              }
            />
          );
        default:
          return null;
      }
    }, [
      type,
      game_timer,
      mitigation_id,
      response_id,
      action_id,
      curveball_id,
      injection,
      gameInjection,
      description,
    ]);

    return shouldDisplay && eventLog;
  },
);

export default EventLogSwitch;
