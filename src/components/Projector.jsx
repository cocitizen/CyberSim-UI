import React, { useEffect, useMemo, useRef, useState } from 'react';
import { view } from '@risingstack/react-easy-state';
import classNames from 'classnames';
import { FiSun, FiMoon } from 'react-icons/fi';

import { GameStates } from '../constants';
import { gameStore } from './GameStore';
import { useStaticData } from './StaticDataProvider';
import useTimeTaken from '../hooks/useTimeTaken';
import { msToMinutesSeconds, numberToUsd } from '../util';
import EventLogs from './EventLogs/EventLogs';
import logo from '../assets/img/cybersim-logo.svg';
import logoWhite from '../assets/img/cybersim-logo-white.svg';
import gremlin from '../assets/img/cocitizen-gremlin.png';

// TODO: source the win threshold from the game/scenario definition once that
// field exists in the backend (see project memory). Stubbed for now — change
// this one line when the real value is available.
const SUPPORT_WIN_THRESHOLD = 50;

const Projector = view(() => {
  const {
    id,
    state: gameState,
    poll,
    budget,
    systems: gameSystems,
    injections: gameInjections,
    mitigations: gameMitigations,
  } = gameStore;
  const {
    systems,
    injections,
    mitigations: staticMitigations,
    getTextWithSynonyms,
    getLocationNameByType,
    scenarioName,
  } = useStaticData();

  const [theme, setTheme] = useState(
    () => localStorage.getItem('projectorTheme') || 'dark',
  );
  const dark = theme === 'dark';
  const toggleTheme = () =>
    setTheme((current) => {
      const next = current === 'dark' ? 'light' : 'dark';
      localStorage.setItem('projectorTheme', next);
      return next;
    });

  const elapsed = useTimeTaken();
  const totalMs = useMemo(
    () =>
      Object.values(injections || {}).reduce(
        (max, inj) => Math.max(max, inj.trigger_time || 0),
        0,
      ),
    [injections],
  );
  const timeLeft = msToMinutesSeconds(Math.max(0, totalMs - elapsed));
  const progress = totalMs > 0 ? Math.min(1, elapsed / totalMs) : 0;

  const belowWin = poll < SUPPORT_WIN_THRESHOLD;
  const downCount = useMemo(
    () =>
      Object.values(systems || {}).filter((s) => !gameSystems[s.id])
        .length,
    [systems, gameSystems],
  );

  // Group systems by their hq/local/party (shared) type, like the facilitator
  // tabs. Empty groups are dropped.
  const systemGroups = useMemo(() => {
    const all = Object.values(systems || {});
    const byType = (t) => all.filter((s) => s.type === t);
    return [
      { key: 'hq', label: getLocationNameByType('hq', 'HQ'), list: byType('hq') },
      {
        key: 'local',
        label: getLocationNameByType('local', 'Local'),
        list: byType('local'),
      },
      { key: 'party', label: 'Shared', list: byType('party') },
    ].filter((group) => group.list.length);
  }, [systems, getLocationNameByType]);

  // Incidents: only what the table knows — delivered events with a negative
  // consequence (system disabled, or support/budget loss), newest first.
  const incidents = useMemo(
    () =>
      Object.values(gameInjections || {})
        .filter((gi) => gi.delivered)
        .map((gi) => ({ gi, inj: injections[gi.injection_id] }))
        .filter(
          ({ inj }) =>
            inj &&
            (inj.systems_to_disable?.length ||
              (inj.poll_change && inj.poll_change < 0) ||
              (inj.budget_change && inj.budget_change < 0)),
        )
        .sort((a, b) => (b.gi.delivered_at || 0) - (a.gi.delivered_at || 0))
        .slice(0, 5),
    [gameInjections, injections],
  );

  const purchased = useMemo(
    () =>
      Object.entries(gameMitigations || {})
        .filter(([, on]) => on)
        .map(([mid]) => staticMitigations[mid])
        .filter(Boolean),
    [gameMitigations, staticMitigations],
  );

  // Transient banner when a system newly fails.
  const [banner, setBanner] = useState(null);
  const prevSystems = useRef(gameSystems);
  const bannerTimer = useRef(null);
  useEffect(() => {
    const prev = prevSystems.current || {};
    const newlyDown = Object.keys(gameSystems || {}).filter(
      (sid) => prev[sid] && !gameSystems[sid],
    );
    if (newlyDown.length) {
      const name = systems[newlyDown[0]]?.name || newlyDown[0];
      setBanner(`${name} is DOWN`);
      if (bannerTimer.current) clearTimeout(bannerTimer.current);
      bannerTimer.current = setTimeout(() => setBanner(null), 6000);
    }
    prevSystems.current = { ...gameSystems };
  }, [gameSystems, systems]);
  useEffect(
    () => () => bannerTimer.current && clearTimeout(bannerTimer.current),
    [],
  );

  const isAssessment = gameState === GameStates.ASSESSMENT;

  return (
    <div
      className={classNames(
        'cs-projector',
        dark ? 'cs-projector--dark' : 'cs-projector--light',
        { 'cs-projector--critical': downCount > 0 },
      )}
    >
      {banner && (
        <div className="cs-pj-banner" role="alert">
          <span aria-hidden="true">⚠</span> {banner}
        </div>
      )}

      <div className="cs-pj-header">
        <a className="cs-pj-brand" href="/">
          <img src={dark ? logoWhite : logo} alt="CyberSim" />
        </a>
        <div className="cs-pj-time">
          <div className="cs-pj-time__label">Time left</div>
          <div className="cs-pj-time__value">{timeLeft}</div>
        </div>
        <div className="cs-pj-title">{id}</div>
      </div>

      <div className="cs-pj-progress" title="Time elapsed">
        <div
          className="cs-pj-progress__fill"
          style={{ width: `${Math.round(progress * 100)}%` }}
        />
      </div>

      <div className="cs-pj-hero">
        <div className="cs-pj-stat">
          <div className="cs-pj-stat__label">
            {getTextWithSynonyms('Support')}
          </div>
          <div
            className={classNames('cs-pj-stat__value cs-pj-support', {
              'cs-pj-support--below': belowWin,
            })}
          >
            {Math.round(poll)}%
          </div>
        </div>
        <div className="cs-pj-stat cs-pj-stat--right">
          <div className="cs-pj-stat__label">
            {getTextWithSynonyms('Budget')}
          </div>
          <div
            className={classNames('cs-pj-stat__value', {
              'cs-pj-budget--neg': budget < 0,
            })}
          >
            {numberToUsd(budget).replace('$', '$ ')}
          </div>
        </div>
      </div>

      <div className="cs-pj-barwrap">
        <div className="cs-pj-bar">
          <div
            className={classNames('cs-pj-bar__fill', {
              'cs-pj-bar__fill--below': belowWin,
            })}
            style={{ width: `${Math.max(0, Math.min(poll, 100))}%` }}
          />
          <div
            className="cs-pj-bar__win"
            style={{ left: `${SUPPORT_WIN_THRESHOLD}%` }}
          >
            <span className="cs-pj-bar__winlabel">
              WIN {SUPPORT_WIN_THRESHOLD}%
            </span>
          </div>
        </div>
      </div>

      {isAssessment ? (
        <div className="cs-pj-body cs-pj-body--logs">
          <EventLogs />
        </div>
      ) : (
        <>
          <div className="cs-pj-body">
            <div>
              <div className="cs-pj-h">Technical systems</div>
              <div className="cs-pj-sysgroups">
                {systemGroups.map((group) => (
                  <div key={group.key}>
                    <div className="cs-pj-sysgroup__label">
                      {group.label}
                    </div>
                    <div className="cs-pj-systems">
                      {group.list.map((sys) => {
                        const up = gameSystems[sys.id];
                        return (
                          <div
                            key={sys.id}
                            className={classNames('cs-pj-tile', {
                              'cs-pj-tile--down': !up,
                            })}
                          >
                            {up ? (
                              <span className="cs-pj-dot" />
                            ) : (
                              <span aria-hidden="true">⚠</span>
                            )}
                            {sys.name}
                            {!up && ' · DOWN'}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="cs-pj-h">Incidents</div>
              {incidents.length ? (
                <div className="cs-pj-incidents">
                  {incidents.map(({ gi, inj }) => (
                    <div
                      key={gi.injection_id}
                      className="cs-pj-incident"
                    >
                      <span className="cs-pj-incident__time">
                        {msToMinutesSeconds(gi.delivered_at || 0)}
                      </span>{' '}
                      {inj.title}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="cs-pj-empty">No incidents yet.</div>
              )}
            </div>
          </div>

          <div className="cs-pj-purchased">
            <span className="cs-pj-h cs-pj-h--inline">
              Purchased items
            </span>
            {purchased.length ? (
              <div className="cs-pj-chips">
                {purchased.map((m) => (
                  <span key={m.id} className="cs-pj-chip">
                    {m.description}
                  </span>
                ))}
              </div>
            ) : (
              <span className="cs-pj-empty">None yet.</span>
            )}
          </div>
        </>
      )}

      <div className="cs-pj-footer">
        <div className="cs-pj-footer__inner">
          <span className="cs-pj-footer__brand">
            <img
              className="cs-pj-gremlin"
              src={gremlin}
              alt=""
              aria-hidden="true"
            />
            Powered by CoCitizen
          </span>
          <div className="cs-pj-footer__right">
            {scenarioName && <span>Scenario: {scenarioName}</span>}
            <button
              type="button"
              className="cs-pj-toggle"
              onClick={toggleTheme}
              aria-label={
                dark ? 'Switch to light theme' : 'Switch to dark theme'
              }
            >
              {dark ? <FiSun /> : <FiMoon />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

export default Projector;
