import React, { useRef, useState } from 'react';
import { Form, Button } from 'react-bootstrap';
import { view } from '@risingstack/react-easy-state';
import { useNavigate } from 'react-router-dom';
import {
  FiArrowRight,
  FiChevronDown,
  FiLogIn,
  FiSettings,
} from 'react-icons/fi';

import { SocketEvents } from '../constants';
import { gameStore } from './GameStore';
import { useStaticData } from './StaticDataProvider';
import logo from '../assets/img/cybersim-logo.svg';
import turtle from '../assets/img/cybersim-turtle.svg';
import gremlin from '../assets/img/cocitizen-gremlin.png';
import candidate from '../assets/img/entry/candidate.png';
import hacker from '../assets/img/entry/hacker.png';
import fire from '../assets/img/entry/fire.png';
import newspaper from '../assets/img/entry/newspaper.png';
import {
  gameViewPath,
  isValidGameName,
  normalizeGameName,
} from '../util/gameSlug';

const EnterGame = view(() => {
  const navigate = useNavigate();
  const {
    loading,
    actions: { enterGame },
  } = gameStore;

  const { getTextWithSynonyms, scenarioName } = useStaticData();

  const [entryMode, setEntryMode] = useState('create');
  const [gameId, setGameId] = useState('');
  const [gameIdError, setGameIdError] = useState('');
  const gameIdInputRef = useRef(null);

  const [adjustGameConfig, setAdjustGameConfig] = useState(false);
  const [initialBudget, setInitialBudget] = useState(6000);
  const [initialPollPercentage, setInitialPollPercentage] =
    useState(55.0);

  return (
    <main className="cs-entry">
      <section className="cs-entry__brand" aria-labelledby="entry-tagline">
        <div className="cs-entry__brand-inner">
          <a
            className="cs-entry__logo-link"
            href="https://cybersim.app"
            target="_blank"
            rel="noreferrer"
            aria-label="Visit the CyberSim website"
          >
            <img className="cs-entry__logo" src={logo} alt="CyberSim" />
          </a>
          <div className="cs-entry__copy">
            <p className="cs-entry__eyebrow">
              A cybersecurity tabletop exercise
            </p>
            <h1 id="entry-tagline">
              A safe place to have a <span>very bad day.</span>
            </h1>
            <p className="cs-entry__lede">
              Face realistic cybersecurity threats in a scenario that
              reflects your team&rsquo;s day-to-day work.
            </p>
            <a
              className="cs-entry__learn"
              href="https://cybersim.app"
              target="_blank"
              rel="noreferrer"
            >
              Learn how CyberSim works <span aria-hidden="true">→</span>
            </a>
          </div>

          <a
            className="cs-entry__steward"
            href="https://cocitizen.com"
            target="_blank"
            rel="noreferrer"
          >
            <img src={gremlin} alt="" aria-hidden="true" />
            <span>
              Stewarded by <strong>CoCitizen</strong>
            </span>
          </a>
        </div>

        <div className="cs-entry__turtle-stage" aria-hidden="true">
          <div className="cs-entry__orbit cs-entry__orbit--one" />
          <div className="cs-entry__orbit cs-entry__orbit--two" />
          <img src={turtle} alt="" />
        </div>

        <div className="cs-entry__incident-tokens" aria-hidden="true">
          <img
            className="cs-entry__incident-token"
            src={candidate}
            alt=""
          />
          <img
            className="cs-entry__incident-token"
            src={hacker}
            alt=""
          />
          <img
            className="cs-entry__incident-token"
            src={fire}
            alt=""
          />
          <img
            className="cs-entry__incident-token"
            src={newspaper}
            alt=""
          />
        </div>
      </section>

      <section className="cs-entry__panel" aria-labelledby="entry-title">
        <div className="cs-entry-card">
          <header className="cs-entry-card__header">
            <div className="cs-entry-card__meta">
              <p className="cs-entry-card__kicker">Facilitator app</p>
              {scenarioName && (
                <p className="cs-entry-card__scenario">
                  <span>Scenario</span>
                  <strong>{scenarioName}</strong>
                </p>
              )}
            </div>
            <h2 id="entry-title">Enter the simulation</h2>
          </header>

          <Form
            onSubmit={(event) => {
              event.preventDefault();
              event.stopPropagation();

              const normalizedGameId = normalizeGameName(gameId);
              if (!normalizedGameId) {
                setGameIdError('Enter a game name to continue.');
                gameIdInputRef.current?.focus();
                return;
              }
              if (!isValidGameName(normalizedGameId)) {
                setGameIdError('Use letters, numbers, and spaces only.');
                gameIdInputRef.current?.focus();
                return;
              }

              enterGame({
                eventType:
                  entryMode === 'create'
                    ? SocketEvents.CREATEGAME
                    : SocketEvents.JOINGAME,
                gameId: normalizedGameId,
                ...(entryMode === 'create' && {
                  initialBudget,
                  initialPollPercentage,
                }),
                onSuccess: (game) =>
                  navigate(
                    gameViewPath(
                      game.id || normalizedGameId,
                      'facilitator',
                    ),
                    { replace: true },
                  ),
              });
            }}
          >
            <div
              className="cs-entry-card__modes"
              role="group"
              aria-label="Choose how to enter the simulation"
            >
              <button
                type="button"
                className="cs-entry-card__mode"
                aria-pressed={entryMode === 'create'}
                onClick={() => {
                  setEntryMode('create');
                  setGameIdError('');
                }}
              >
                Create a game
              </button>
              <button
                type="button"
                className="cs-entry-card__mode"
                aria-pressed={entryMode === 'join'}
                onClick={() => {
                  setEntryMode('join');
                  setAdjustGameConfig(false);
                  setGameIdError('');
                }}
              >
                Join a game
              </button>
            </div>

            <Form.Group controlId="GameId" className="cs-entry-card__field">
              <Form.Label>
                Game name
                <span className="cs-entry-card__required">required</span>
              </Form.Label>
              <Form.Control
                ref={gameIdInputRef}
                type="text"
                placeholder={
                  entryMode === 'create'
                    ? 'e.g. Tuesday workshop'
                    : 'Enter the exact game name'
                }
                onChange={(event) => {
                  setGameId(event.target.value);
                  if (event.target.value.trim()) {
                    setGameIdError('');
                  }
                }}
                value={gameId}
                autoComplete="off"
                isInvalid={Boolean(gameIdError)}
              />
              <Form.Control.Feedback type="invalid">
                {gameIdError}
              </Form.Control.Feedback>
              <Form.Text>
                {entryMode === 'create'
                  ? 'Choose a memorable name—you’ll use it to return to this game.'
                  : 'Enter the name chosen when the game was created.'}
              </Form.Text>
            </Form.Group>

            {entryMode === 'create' && (
              <button
                type="button"
                className="cs-entry-card__disclosure"
                aria-expanded={adjustGameConfig}
                aria-controls="starting-conditions"
                onClick={() => setAdjustGameConfig((open) => !open)}
              >
                <span className="cs-entry-card__disclosure-label">
                  <FiSettings aria-hidden="true" />
                  <strong>Starting conditions</strong>
                </span>
                <span className="cs-entry-card__disclosure-summary">
                  ${Number(initialBudget || 0).toLocaleString()} ·{' '}
                  {initialPollPercentage || 0}%
                </span>
                <FiChevronDown
                  className="cs-entry-card__disclosure-chevron"
                  aria-hidden="true"
                />
              </button>
            )}

            {entryMode === 'create' && adjustGameConfig && (
              <div
                className="cs-entry-card__advanced"
                id="starting-conditions"
              >
                <Form.Group controlId="Budget">
                  <Form.Label>
                    {getTextWithSynonyms('Starting budget')}
                  </Form.Label>
                  <Form.Control
                    type="number"
                    placeholder={getTextWithSynonyms('Budget')}
                    size="sm"
                    onChange={(event) => {
                      const newValue = !event.target.value.length
                        ? ''
                        : parseInt(event.target.value, 10);

                      setInitialBudget(newValue);
                    }}
                    value={initialBudget}
                    step={100}
                    min={0}
                    isInvalid={!initialBudget}
                    autoComplete="off"
                  />
                </Form.Group>

                <Form.Group controlId="PollPercentage">
                  <Form.Label>
                    {getTextWithSynonyms(
                      'Starting poll percentage',
                    )}
                  </Form.Label>
                  <Form.Control
                    type="number"
                    placeholder={getTextWithSynonyms(
                      'Poll percentage',
                    )}
                    onChange={(event) => {
                      const newValue = !event.target.value.length
                        ? ''
                        : parseFloat(event.target.value);

                      setInitialPollPercentage(newValue);
                    }}
                    value={initialPollPercentage}
                    autoComplete="off"
                    step={0.5}
                    max={200}
                    min={0}
                    isInvalid={!initialPollPercentage}
                  />
                </Form.Group>
              </div>
            )}

            <div className="cs-entry-card__actions">
              <Button
                variant="primary"
                className="btn-brand cs-entry-card__primary"
                type="submit"
                disabled={loading}
              >
                {loading
                  ? 'Entering…'
                  : entryMode === 'create'
                  ? 'Create game'
                  : 'Join game'}
                {!loading &&
                  (entryMode === 'create' ? (
                    <FiArrowRight aria-hidden="true" />
                  ) : (
                    <FiLogIn aria-hidden="true" />
                  ))}
              </Button>
            </div>
          </Form>
        </div>
      </section>
    </main>
  );
});

export default EnterGame;
