/**
 * Node.js socket.io helper for Playwright test setup.
 *
 * Connects directly to the CyberSim backend (bypassing the browser) to create
 * a game, start the simulation, and deliver injections without waiting for the
 * frontend trigger-time check.  The backend's deliverInjection handler does not
 * validate trigger_time, so all injections can be delivered immediately.
 */

const { io } = require('socket.io-client');

const API_URL = 'http://localhost:3001';
const SCENARIO_SLUG = 'cso';
const SOCKET_TIMEOUT_MS = 15_000;

function connectSocket() {
  return new Promise((resolve, reject) => {
    const socket = io(API_URL, {
      transports: ['polling', 'websocket'],
      reconnection: false,
      timeout: SOCKET_TIMEOUT_MS,
    });

    const timer = setTimeout(() => {
      socket.disconnect();
      reject(new Error('Socket connect timeout'));
    }, SOCKET_TIMEOUT_MS);

    socket.on('connect', () => {
      clearTimeout(timer);
      resolve(socket);
    });

    socket.on('connect_error', (err) => {
      clearTimeout(timer);
      reject(new Error(`Socket connect error: ${err.message}`));
    });
  });
}

function emitWithCallback(socket, event, ...args) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`Socket event "${event}" timed out`)),
      SOCKET_TIMEOUT_MS,
    );

    socket.emit(event, ...args, (result) => {
      clearTimeout(timer);
      if (result?.error) {
        reject(new Error(`"${event}" failed: ${result.error}`));
      } else {
        resolve(result?.game);
      }
    });
  });
}

/**
 * Creates a new game, starts the simulation, and delivers all injections
 * needed by the test suite.  No gating mitigations are purchased so that
 * locked-response state is visible in the UI.
 *
 * @param {string} gameId  Unique game identifier for this test run.
 */
async function setupGame(gameId) {
  const socket = await connectSocket();

  try {
    // Create game — no mitigations purchased, default budget $6,000
    await emitWithCallback(
      socket,
      'createGame',
      gameId,
      100000, // initialBudget
      55.0, // initialPollPercentage
      SCENARIO_SLUG,
    );

    // Advance to SIMULATION state
    await emitWithCallback(socket, 'startSimulation');

    // Deliver all injections needed by the test cases.
    // The backend does NOT check trigger_time on deliverInjection, so this
    // works regardless of the in-game timer.
    const injectionsToDeliver = [
      'recRJh7cpEgDrAbQ0', // 1016 — Grassroots Network organizer's phone stolen (LOCAL) — TC-1, TC-2, TC-7
      'recth3Hpy9yYNHH6P', // 1021 — Malware corrupts critical information (LOCAL)       — TC-4
      'rechW2QnG1DxlEEgZ', // 1055 — Ransomware attack disables GN computers (LOCAL)     — TC-4
      'recHhJpOvsfUi3x7L', // 1048 — Contact management system deleted suddenly (HQ)     — TC-3
      'recaV5aL9GR8xYZdD', // 1006 — Access to Facebook blocked in area (LOCAL)          — TC-5
      'recaxARH7iyFC7Ngl', // 1001 — Amazon databreach (HQ)                              — TC-6
    ];

    for (const injectionId of injectionsToDeliver) {
      await emitWithCallback(socket, 'deliverInjection', {
        injectionId,
      });
    }
  } finally {
    socket.disconnect();
  }
}

module.exports = { setupGame };
