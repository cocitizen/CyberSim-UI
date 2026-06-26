import React, { useEffect, useRef, useState } from 'react';
import classNames from 'classnames';
import { view } from '@risingstack/react-easy-state';

import { SimulationTabs } from '../../constants';
import { gameStore } from '../GameStore';
import { useStaticData } from '../StaticDataProvider';
import logo from '../../assets/img/cybersim-logo.svg';

const scrollToId = (id) =>
  document.querySelector(id)?.scrollIntoView({ behavior: 'smooth' });

// Tracks which section the facilitator is currently in, for the jump-strip
// "you are here" pill. The active section is the last one whose top has
// scrolled past the header line; a bottom-of-page guard ensures the final
// (often short) section still wins when scrolled all the way down. `offset`
// is the measured sticky-header height.
const useScrollSpy = (ids, offset) => {
  const key = ids.join(',');
  const [activeId, setActiveId] = useState(ids[0] || null);
  // A click sets the active pill directly and briefly "locks" the spy, so a
  // jumped-to section stays highlighted even when the page can't scroll it to
  // the top (short trailing sections like Technical systems / Curveballs,
  // which are indistinguishable from scroll position alone).
  const lockUntil = useRef(0);
  useEffect(() => {
    if (!ids.length) return undefined;
    let raf = null;
    const compute = () => {
      raf = null;
      if (Date.now() < lockUntil.current) return;
      const line = offset + 8;
      let current = ids[0];
      ids.forEach((id) => {
        const el = document.querySelector(id);
        if (el && el.getBoundingClientRect().top <= line) current = id;
      });
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - window.innerHeight > 4;
      const atBottom =
        window.innerHeight + window.scrollY >= doc.scrollHeight - 2;
      // Only force the last section when the page can actually scroll —
      // otherwise a short page (Local/HQ) is "at bottom" at rest and would
      // pin the pill to the final section forever.
      if (scrollable && atBottom) current = ids[ids.length - 1];
      setActiveId(current);
    };
    const onScroll = () => {
      if (raf == null) raf = window.requestAnimationFrame(compute);
    };
    compute();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf != null) window.cancelAnimationFrame(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, offset]);

  const jumpTo = (id) => {
    setActiveId(id);
    lockUntil.current = Date.now() + 800;
    scrollToId(id);
  };

  return [activeId, jumpTo];
};

const Header = view(({ activeTab, setActiveTab }) => {
  const { id } = gameStore;
  const { getLocationNameByType, scenarioName } = useStaticData();

  // Measure the real header height and publish it as a CSS variable so
  // scroll-into-view offsets stay correct regardless of font size / wrapping.
  const headerRef = useRef(null);
  const [headerH, setHeaderH] = useState(150);
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return undefined;
    const update = () => {
      const h = el.offsetHeight;
      setHeaderH(h);
      document.documentElement.style.setProperty(
        '--sim-header-h',
        `${h}px`,
      );
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const hqName = getLocationNameByType('hq', 'HQ');
  const localName = getLocationNameByType('local', 'Local');

  const tabs = [
    { key: SimulationTabs.ACTION_TABLE, label: 'Action table' },
    { key: SimulationTabs.CAMPAIGN_HQ, label: hqName },
    { key: SimulationTabs.LOCAL_BRANCH, label: localName },
    { key: SimulationTabs.LOGS_AND_THREATS, label: 'Event logs' },
  ];

  const facilitatorJumps = [
    { id: '#injects', label: 'Events & responses' },
    { id: '#system_actions', label: 'System restore' },
    { id: '#resolved_injects', label: 'Resolved events' },
  ];

  const jumpsByTab = {
    [SimulationTabs.ACTION_TABLE]: [
      { id: '#hq_actions', label: `${hqName} actions` },
      { id: '#local_actions', label: `${localName} actions` },
      { id: '#mitigations', label: 'Item inventory' },
      { id: '#systems', label: 'Technical systems' },
      { id: '#curveball', label: 'Curveball events' },
    ],
    [SimulationTabs.CAMPAIGN_HQ]: facilitatorJumps,
    [SimulationTabs.LOCAL_BRANCH]: facilitatorJumps,
    [SimulationTabs.LOGS_AND_THREATS]: [
      { id: '#threats', label: 'Threats' },
      { id: '#logs', label: 'Event log' },
    ],
  };

  const jumps = jumpsByTab[activeTab] || [];
  const [activeJump, jumpTo] = useScrollSpy(
    jumps.map((j) => j.id),
    headerH,
  );

  return (
    <div
      ref={headerRef}
      className="position-sticky simulation-menu bg-white shadow-sm"
    >
      <div className="cs-commandbar">
        <a href="/" className="cs-brand">
          <img src={logo} alt="CyberSim" />
        </a>
        <div className="cs-gamectx">
          <div className="cs-gamectx__id">{id}</div>
          {scenarioName && (
            <div className="cs-gamectx__scenario">
              Scenario · {scenarioName}
            </div>
          )}
        </div>
      </div>

      <div className="cs-tabbar">
        {tabs.map((t) => (
          <div
            key={t.key}
            className={classNames('cs-tab', {
              active: activeTab === t.key,
            })}
            onClick={() => setActiveTab(t.key)}
          >
            {t.label}
          </div>
        ))}
      </div>

      <div className="cs-jump-strip">
        <span className="cs-meta cs-jump-strip__label">Jump to</span>
        {jumps.map((j) => (
          <span
            key={j.id}
            className={classNames('cs-jump', {
              active: activeJump === j.id,
            })}
            onClick={() => jumpTo(j.id)}
          >
            {j.label}
          </span>
        ))}
      </div>
    </div>
  );
});

export default Header;
