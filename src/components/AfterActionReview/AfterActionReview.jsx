import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Spinner } from 'react-bootstrap';
import { view } from '@risingstack/react-easy-state';
import classNames from 'classnames';
import { FiSun, FiMoon } from 'react-icons/fi';
import { BsBuilding, BsHouseDoor } from 'react-icons/bs';

import { gameStore } from '../GameStore';
import { useStaticData } from '../StaticDataProvider';
import { numberToUsd } from '../../util';
import AARTimeline from './AARTimeline';
import AARPrepSection from './AARPrepSection';

const API = process.env.REACT_APP_API_URL;

export const aarLocations = {
  HQ: 'hq',
  Local: 'local',
};

const AfterActionReview = view(() => {
  const gameId = gameStore.id;
  const { getLocationNameByType } = useStaticData();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Two independent facets. Everything starts on; a chip toggles its group off.
  const [hiddenLocations, setHiddenLocations] = useState([]);
  const [hiddenCategories, setHiddenCategories] = useState([]);

  const [theme, setTheme] = useState(
    () => localStorage.getItem('aarTheme') || 'dark',
  );
  const dark = theme === 'dark';
  const toggleTheme = () =>
    setTheme((current) => {
      const next = current === 'dark' ? 'light' : 'dark';
      localStorage.setItem('aarTheme', next);
      return next;
    });

  useEffect(() => {
    if (!gameId) return;
    setLoading(true);
    axios
      .get(`${API}/games/${gameId}/aar`)
      .then((res) => {
        setData(res.data);
        setLoading(false);
      })
      .catch((err) => {
        setError(
          err?.response?.data?.message ||
            'Failed to load after action review.',
        );
        setLoading(false);
      });
  }, [gameId]);

  const allChains = useMemo(() => data?.chains || [], [data]);

  const availableCategories = useMemo(
    () =>
      [
        ...new Set(
          allChains.map((c) => c.handbook_category).filter(Boolean),
        ),
      ].sort(),
    [allChains],
  );

  const prepChains = useMemo(
    () =>
      allChains.filter(
        (c) =>
          c.category === 'prevented' &&
          c.skipper_mitigation?.purchased_in_preparation === true,
      ),
    [allChains],
  );

  const gameChains = useMemo(
    () =>
      allChains.filter(
        (c) =>
          !(
            c.category === 'prevented' &&
            c.skipper_mitigation?.purchased_in_preparation === true
          ),
      ),
    [allChains],
  );

  const passesFilter = useMemo(
    () => (c) =>
      (!c.location || !hiddenLocations.includes(c.location)) &&
      (!c.handbook_category ||
        !hiddenCategories.includes(c.handbook_category)),
    [hiddenLocations, hiddenCategories],
  );

  const filteredPrepChains = useMemo(
    () => prepChains.filter(passesFilter),
    [prepChains, passesFilter],
  );

  const filteredGameChains = useMemo(
    () => gameChains.filter(passesFilter),
    [gameChains, passesFilter],
  );

  const toggleValue = (setter) => (value) =>
    setter((current) =>
      current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value],
    );
  const toggleLocation = toggleValue(setHiddenLocations);
  const toggleCategory = toggleValue(setHiddenCategories);
  const clearFilters = () => {
    setHiddenLocations([]);
    setHiddenCategories([]);
  };
  const hasFilters =
    hiddenLocations.length > 0 || hiddenCategories.length > 0;

  const locationChips = [
    {
      value: aarLocations.HQ,
      label: getLocationNameByType('hq', 'HQ'),
      Icon: BsBuilding,
    },
    {
      value: aarLocations.Local,
      label: getLocationNameByType('local', 'Local'),
      Icon: BsHouseDoor,
    },
  ];

  let content;
  if (loading) {
    content = (
      <div className="cs-aar__state">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  } else if (error) {
    content = (
      <div className="cs-aar__state">
        <p className="text-danger">{error}</p>
      </div>
    );
  } else {
    content = (
      <>
        <div className="cs-aar__filter">
          <div className="cs-aar__facet">
            <span className="cs-aar__filter-label">Location</span>
            {locationChips.map(({ value, label, Icon }) => (
              <button
                key={value}
                type="button"
                className={classNames('cs-aar-chip', {
                  'cs-aar-chip--on': !hiddenLocations.includes(value),
                })}
                aria-pressed={!hiddenLocations.includes(value)}
                onClick={() => toggleLocation(value)}
              >
                <Icon aria-hidden="true" />
                {label}
              </button>
            ))}
          </div>
          {availableCategories.length > 0 && (
            <div className="cs-aar__facet">
              <span className="cs-aar__filter-label">Focus area</span>
              {availableCategories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={classNames('cs-aar-chip', {
                    'cs-aar-chip--on': !hiddenCategories.includes(cat),
                  })}
                  aria-pressed={!hiddenCategories.includes(cat)}
                  onClick={() => toggleCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
          {hasFilters && (
            <button
              type="button"
              className="cs-aar-textbtn cs-aar__filter-clear"
              onClick={clearFilters}
            >
              Clear filters
            </button>
          )}
        </div>

        <AARPrepSection chains={filteredPrepChains} />
        <AARTimeline
          chains={filteredGameChains}
          hasEvents={gameChains.length > 0}
          onClearFilters={clearFilters}
        />
      </>
    );
  }

  return (
    <div
      className={classNames(
        'cs-aar',
        dark ? 'cs-aar--dark' : 'cs-aar--light',
      )}
    >
      <div className="cs-aar__inner">
        <header className="cs-aar__top">
          <div>
            <div className="cs-aar__eyebrow">After action review</div>
            <h1 className="cs-aar__title">Debrief</h1>
            <div className="cs-aar__gameid">Game {gameId}</div>
          </div>
          {data?.game && (
            <div className="cs-aar__readouts">
              <div className="cs-aar-stat">
                <div className="cs-aar-stat__label">Final budget</div>
                <div
                  className={classNames('cs-aar-stat__value', {
                    'cs-aar-stat__value--bad': data.game.budget < 0,
                  })}
                >
                  {numberToUsd(data.game.budget)}
                </div>
              </div>
              <div className="cs-aar-stat">
                <div className="cs-aar-stat__label">Final support</div>
                <div className="cs-aar-stat__value">{data.game.poll}%</div>
              </div>
            </div>
          )}
          <button
            type="button"
            className="cs-aar__toggle"
            onClick={toggleTheme}
            aria-label={
              dark ? 'Switch to light theme' : 'Switch to dark theme'
            }
          >
            {dark ? <FiSun /> : <FiMoon />}
          </button>
        </header>
        {content}
      </div>
    </div>
  );
});

export default AfterActionReview;
