/* Real production GameStore + Socket.IO clients and Backend, on an owned local
 * synthetic database only. No browser event mocking, AWS, or existing servers. */
const assert = require('assert/strict');
const fs = require('fs');
const http = require('http');
const Module = require('module');
const path = require('path');
const { io: client } = require('socket.io-client');
const babel = require('@babel/core');

const backend = path.resolve(__dirname, '../../CyberSim-Backend');
const source = path.resolve(__dirname, '../src');
const database = new URL(process.env.DB_URL);
assert.equal(process.env.CYBERSIM_OWNED_LOCAL_TEST, '1');
assert.equal(database.hostname, 'localhost');
assert.equal(database.pathname, '/cybersim_test_lightsail');
assert.equal(process.env.DOTENV_CONFIG_PATH, '/dev/null');
const db = require(path.join(backend, 'src/models/db'));
const createSocket = require(path.join(backend, 'src/socketio'));
const app = require(path.join(backend, 'src/app'));
let running;
const clients = [];

async function until(predicate, description, timeout = 12000) {
  const deadline = Date.now() + timeout;
  while (!predicate()) {
    if (Date.now() > deadline) throw new Error(`Timeout: ${description}`);
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
}

async function start(port = 0) {
  const server = http.createServer(app);
  const io = createSocket(server);
  await new Promise((resolve) => server.listen(port, '127.0.0.1', resolve));
  running = { server, io, port: server.address().port };
}

function emit(socket, event, ...args) {
  return new Promise((resolve, reject) => {
    socket.timeout(5000).emit(event, ...args, (err, result = {}) => {
      if (err || result.error) reject(new Error(`Synthetic Socket.IO operation failed: ${event}`));
      else resolve(result);
    });
  });
}

async function main() {
  await db.migrate.latest();
  await require(path.join(backend, 'tests/seedTestData'))(db);
  await start();
  process.env.REACT_APP_API_URL = `http://127.0.0.1:${running.port}`;
  process.env.REACT_APP_SCENARIO_SLUG = 'cso';
  global.window = {
    location: { hostname: 'localhost' }, Date, performance,
    setTimeout, clearTimeout,
    requestAnimationFrame: (callback) => setTimeout(callback, 0),
    cancelAnimationFrame: clearTimeout,
  };
  global.localStorage = { setItem() {}, removeItem() {} };
  const original = Module._extensions['.js'];
  const load = (module, filename) => {
    if (filename.startsWith(`${source}${path.sep}`)) {
      const transformed = babel.transformSync(fs.readFileSync(filename, 'utf8'), {
        filename, babelrc: false, configFile: false,
        plugins: [require.resolve('@babel/plugin-transform-modules-commonjs')],
      });
      module._compile(transformed.code, filename);
    } else original(module, filename);
  };
  Module._extensions['.js'] = load;
  Module._extensions['.jsx'] = load;
  const { gameStore } = require('../src/components/GameStore.jsx');
  const socket = gameStore.ensureSocket();
  clients.push(socket);
  await until(() => gameStore.socketConnected, 'initial connection');
  const gameId = `synthetic-reconnect-${process.pid}`;
  await new Promise((resolve, reject) => gameStore.actions.enterGame({
    eventType: 'createGame', gameId,
    onSuccess: resolve, onError: () => reject(new Error('Synthetic create failed')),
  }));
  gameStore.actions.resumeSimulation();
  await until(() => gameStore.state === 'SIMULATION', 'simulation start');
  await until(() => socket.io.engine.transport.name === 'websocket', 'WebSocket upgrade');

  // Exercise the real command handlers as well as recovery, using only the
  // existing synthetic scenario. This catches missing/miswired socket routes.
  const curve = await emit(socket, 'performCurveball', { curveballId: 'C7' });
  assert.equal(curve.game.budget, 1500);
  const action = await emit(socket, 'performAction', { actionId: 'A2' });
  assert.equal(action.game.budget, 500);
  const injection = await emit(socket, 'deliverInjection', { injectionId: 'I1' });
  assert(injection.game.injections.find((item) => item.injection_id === 'I1').delivered);
  await emit(socket, 'nonCorrectRespondToInjection', { injectionId: 'I1', customResponse: 'Synthetic response for local verification' });
  await emit(socket, 'deliverInjection', { injectionId: 'I2' });
  const response = await emit(socket, 'respondToInjection', { injectionId: 'I2', responseIds: ['RP2'] });
  assert(response.game.injections.find((item) => item.injection_id === 'I2').is_response_correct);
  await emit(socket, 'performCurveball', { curveballId: 'C7' });
  await emit(socket, 'changeMitigation', { id: 'M1', value: true });
  const restored = await emit(socket, 'restoreSystem', { responseId: 'RP1' });
  assert(restored.game.systems.find((item) => item.system_id === 'S2').state);
  console.log('Real socket action, curveball, injection, response, mitigation, and restore handlers: passed.');

  for (const transport of ['websocket', 'polling']) {
    const previousId = socket.id;
    const port = running.port;
    await new Promise((resolve) => running.io.close(resolve));
    await until(() => gameStore.connectionLost, 'disconnect observed');
    socket.io.opts.transports = [transport];
    const readyAt = Date.now();
    await start(port);
    await until(() => socket.id !== previousId && gameStore.socketConnected && !gameStore.connectionLost, `${transport} membership recovery`);
    assert(running.io.sockets.sockets.get(socket.id).rooms.has(gameId));
    assert.equal(gameStore.id, gameId);
    assert(Date.now() - readyAt < 10000, 'Rejoin exceeded ten seconds after readiness');
    const observed = client(process.env.REACT_APP_API_URL, { transports: [transport], reconnection: false });
    clients.push(observed);
    await until(() => observed.connected, 'second client');
    await emit(observed, 'joinGame', gameId, null, null, 'cso');
    await emit(observed, 'pauseSimulation');
    await until(() => gameStore.paused === true, 'update after rejoin');
    await emit(observed, 'startSimulation');
    await until(() => gameStore.paused === false, 'subsequent live update');
    observed.disconnect();
    console.log(`Real GameStore ${transport} restart/rejoin/snapshot/update: passed.`);
  }

  const peers = Array.from({ length: 11 }, () => {
    const socket = client(process.env.REACT_APP_API_URL, { reconnection: false });
    clients.push(socket);
    return socket;
  });
  await until(() => peers.every((peer) => peer.connected), 'twelve concurrent clients');
  await Promise.all(peers.map((peer) => emit(peer, 'joinGame', gameId, null, null, 'cso')));
  assert.equal(running.io.sockets.sockets.size, 12);
  await emit(peers[0], 'pauseSimulation');
  await until(() => gameStore.paused === true, 'broadcast with twelve clients');
  console.log('Twelve concurrent real clients and live broadcast: passed (short local check, not a soak test).');
  peers.forEach((peer) => peer.disconnect());

  const finished = await emit(socket, 'finishSimulation');
  assert.equal(finished.game.state, 'ASSESSMENT');
  const aar = await fetch(`${process.env.REACT_APP_API_URL}/games/${encodeURIComponent(gameId)}/aar`);
  assert.equal(aar.status, 200);
  assert.equal((await aar.json()).game.id, gameId);
  console.log('Finish and after-action review API: passed.');

  const port = running.port;
  await new Promise((resolve) => running.io.close(resolve));
  await until(() => gameStore.connectionLost, 'last disconnect');
  await require(path.join(backend, 'src/models/game')).deleteGame(gameId);
  await start(port);
  await until(() => gameStore.id === undefined && gameStore.socketConnected, 'missing-game recovery');
  console.log('Missing game clears stale session after reconnect: passed.');
}

main().catch((err) => {
  console.error('Local real-client recovery verification failed. Only synthetic data was used.', err.code || err.name, String(err.message).replace(/postgres(?:ql)?:\/\/\S+/g, '[URL withheld]').slice(0, 250));
  process.exitCode = 1;
}).finally(async () => {
  clients.forEach((socket) => socket.disconnect());
  if (running) await new Promise((resolve) => running.io.close(resolve));
  await db.destroy();
  // React's scheduler can retain a MessagePort in this Node-only harness.
  // All owned network/database resources have been closed at this point.
  process.exit(process.exitCode || 0);
});
