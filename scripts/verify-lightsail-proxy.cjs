// Exercise the actual container/Caddy path. Invoked only by the owned local
// TLS test harness, never against a configured production API.
const assert = require('assert/strict');
const { io } = require('socket.io-client');
const url = new URL(process.env.CYBERSIM_PROXY_URL);
assert.equal(process.env.CYBERSIM_OWNED_LOCAL_TEST, '1');
assert.equal(url.hostname, 'localhost');
assert.equal(url.protocol, 'http:');

function emit(socket, event, ...args) {
  return new Promise((resolve, reject) => socket.timeout(5000).emit(event, ...args, (error, result = {}) => {
    if (error || result.error) reject(new Error(`Synthetic proxy operation failed: ${event}`));
    else resolve(result.game);
  }));
}

async function main() {
  for (const transport of ['polling', 'websocket']) {
    const socket = io(url.origin, {
      transports: [transport], reconnection: false, timeout: 5000,
      extraHeaders: { Origin: 'https://lightsail.example.invalid' },
    });
    try {
      await new Promise((resolve, reject) => {
        socket.once('connect', resolve);
        socket.once('connect_error', () => reject(new Error(`Local ${transport} proxy connection failed`)));
      });
      const id = `synthetic-proxy-${transport}-${process.pid}`;
      const created = await emit(socket, 'createGame', id, 6000, 55, 'cso');
      assert.equal(created.id, id);
      assert.equal((await emit(socket, 'startSimulation')).state, 'SIMULATION');
      assert.equal((await emit(socket, 'pauseSimulation')).paused, true);
      assert.equal((await emit(socket, 'finishSimulation')).state, 'ASSESSMENT');
      console.log(`Pinned container/Caddy ${transport} create/start/pause/finish with restricted DB role: passed.`);
    } finally {
      socket.disconnect();
    }
  }
}

main().catch((error) => { console.error(error.message); process.exitCode = 1; });
