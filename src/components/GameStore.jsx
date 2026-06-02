import qs from 'query-string';
import { store } from '@risingstack/react-easy-state';
import io from 'socket.io-client';
import { keyBy as _keyBy } from 'lodash';

import { SocketEvents } from '../constants';
import { getScenarioSlug } from '../util/scenario';

let socket = null;

function getApiUrl() {
  return process.env.REACT_APP_API_URL;
}

export const gameStore = store({
  loading: false,
  socketConnected: false,

  // ERROR
  errorTimer: null,
  error: { message: '', show: false },
  closeError: () => (gameStore.error.show = false),
  popError: (errorMessage) => {
    gameStore.error = { message: errorMessage, show: true };
    if (gameStore.errorTimer) clearTimeout(gameStore.errorTimer);
    gameStore.errorTimer = setTimeout(() => gameStore.closeError(), 4000);
  },

  // INFO
  infoTimer: null,
  info: { message: '', show: false },
  closeInfo: () => (gameStore.info.show = false),
  popInfo: (infoMessage) => {
    gameStore.info = { message: infoMessage, show: true };
    if (gameStore.infoTimer) clearTimeout(gameStore.infoTimer);
    gameStore.infoTimer = setTimeout(() => gameStore.closeInfo(), 4000);
  },

  // HELPERS
  setGame: (game) => {
    Object.keys(game).forEach((key) => {
      if (key === 'systems') {
        gameStore.systems = game.systems.reduce(
          (acc, { system_id, state }) => ({ ...acc, [system_id]: state }),
          {},
        );
      } else if (key === 'mitigations') {
        gameStore.mitigations = game.mitigations.reduce(
          (acc, { mitigation_id, state }) => ({
            ...acc,
            [mitigation_id]: state,
          }),
          {},
        );
        gameStore.preparationMitigations = game.mitigations.reduce(
          (acc, { mitigation_id, preparation }) => ({
            ...acc,
            [mitigation_id]: preparation,
          }),
          {},
        );
      } else if (key === 'injections') {
        gameStore.injections = _keyBy(game.injections, 'injection_id');
      } else {
        gameStore[key] = game[key];
      }
    });
  },

  // Socket: create lazily, attach handlers once
  ensureSocket: () => {
    const apiUrl = getApiUrl();

    if (!apiUrl) {
      gameStore.popError(
        'Missing REACT_APP_API_URL. Set it in Amplify env vars and redeploy.',
      );
      return null;
    }

    if (socket) return socket;

    socket = io(apiUrl, {
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      timeout: 5000,
    });

    socket.on(SocketEvents.CONNECT, () => {
      gameStore.socketConnected = true;
    });

    socket.on(SocketEvents.CONNECT_ERROR, () => {
      gameStore.socketConnected = false;
      // Don’t assume we should flip loading here; only specific actions control loading.
      gameStore.popError(`Backend not reachable at ${apiUrl}`);
    });

    socket.on(SocketEvents.DISCONNECT, () => {
      gameStore.socketConnected = false;
    });

    socket.on(SocketEvents.GAMEUPDATED, (g) => gameStore.setGame(g));

    socket.on(SocketEvents.RECONNECT, () => {
      if (gameStore.id) {
        socket.emit(
          SocketEvents.JOINGAME,
          gameStore.id,
          null,
          null,
          getScenarioSlug(),
          ({ error, game: g }) => {
            if (!error) {
              gameStore.setGame(g);
            } else {
              gameStore.popError(error);
            }
          },
        );
      }
    });

    return socket;
  },

  emitEvent: (event, params, successInfo) => {
    const s = gameStore.ensureSocket();
    if (!s) return;

    // If we’re not connected yet, fail loudly rather than silently.
    if (!gameStore.socketConnected) {
      gameStore.popError('Not connected to backend yet. Please try again.');
      return;
    }

    const callback = ({ error }) => {
      if (error) gameStore.popError(error);
      else if (successInfo) gameStore.popInfo(successInfo);
    };

    if (params) s.emit(event, params, callback);
    else s.emit(event, callback);
  },

  actions: {
    enterGame: ({
      eventType,
      gameId,
      rememberGameId,
      initialBudget = 6000,
      initialPollPercentage = 55,
    }) => {
      const s = gameStore.ensureSocket();
      if (!s) return;

      gameStore.loading = true;

      s.emit(
        eventType,
        gameId,
        initialBudget,
        initialPollPercentage,
        // Pass the scenario slug so the backend loads the correct scenario content
        // for this deployment. Resolved from the hostname subdomain (e.g. cso.cybersim.app → 'cso').
        getScenarioSlug(),
        ({ error, game }) => {
          if (!error) {
            gameStore.setGame(game);
            if (rememberGameId) localStorage.setItem('gameId', gameId);
            else localStorage.removeItem('gameId');
          } else {
            gameStore.popError(error);
          }
          gameStore.loading = false;
        },
      );
    },

    resumeSimulation: () => gameStore.emitEvent(SocketEvents.STARTSIMULATION),
    pauseSimulation: () => gameStore.emitEvent(SocketEvents.PAUSESIMULATION),
    finishSimulation: () => gameStore.emitEvent(SocketEvents.FINISHSIMULATION),

    toggleMitigation: (params, showInfo = false) =>
      gameStore.emitEvent(
        SocketEvents.CHANGEMITIGATION,
        params,
        ...(showInfo ? ['Item bought'] : []),
      ),

    performAction: (params) =>
      gameStore.emitEvent(
        SocketEvents.PERFORMACTION,
        params,
        'Action Performed',
      ),

    performCurveball: (params) =>
      gameStore.emitEvent(
        SocketEvents.PERFORMCURVEBALL,
        params,
        'Curveball Performed',
      ),

    restoreSystem: (params) =>
      gameStore.emitEvent(
        SocketEvents.RESTORESYSTEM,
        params,
        'System Restored',
      ),

    startSimulation: () => gameStore.emitEvent(SocketEvents.STARTSIMULATION),

    deliverInjection: (params) =>
      gameStore.emitEvent(SocketEvents.DELIVERINJECTION, params, 'Injection delivered'),

    respondToInjection: (params) =>
      gameStore.emitEvent(
        SocketEvents.RESPONDTOINJECTION,
        params,
        'Response made',
      ),

    nonCorrectRespondToInjection: (params) =>
      gameStore.emitEvent(
        SocketEvents.NONCORRECTRESPONDTOINJECTION,
        params,
        'Response made',
      ),
  },
});

// AUTO JOIN GAME FROM QUERY PARAMS
const { gameId: gameIdFromQuery, ...newParams } = qs.parse(
  window.location.search,
);

if (gameIdFromQuery) {
  const s = gameStore.ensureSocket();
  if (!s) {
    gameStore.loading = false;
  } else {
    gameStore.loading = true;
    s.emit(
      SocketEvents.JOINGAME,
      gameIdFromQuery,
      null,
      null,
      getScenarioSlug(),
      ({ error, game }) => {
        if (!error) {
          gameStore.setGame(game);
          window.history.replaceState(
            null,
            null,
            `?${qs.stringify(newParams)}`,
          );
          localStorage.setItem('gameId', gameIdFromQuery);
        } else {
          gameStore.popError(error);
        }
        gameStore.loading = false;
      },
    );
  }
}
