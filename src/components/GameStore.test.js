// Tests for GameStore socket event handling.
// Focus: callback wiring and guard logic, since the class of bug we've seen
// (missing positional arg shifting the callback into the wrong slot) manifests
// as the callback never firing — setGame/popError never called.

jest.mock('socket.io-client');
jest.mock('../util/scenario', () => ({ getScenarioSlug: jest.fn(() => 'cso') }));
describe('GameStore socket handlers', () => {
  let mockSocket;
  let gameStore;

  beforeEach(() => {
    jest.resetModules();

    mockSocket = { emit: jest.fn(), on: jest.fn() };
    require('socket.io-client').mockReturnValue(mockSocket);
    require('../util/scenario').getScenarioSlug.mockReturnValue('cso');
    process.env.REACT_APP_API_URL = 'http://localhost:3000';
    delete window.location;
    window.location = { hostname: 'localhost', search: '' };

    ({ gameStore } = require('./GameStore'));
    gameStore.ensureSocket();
  });

  function getHandler(event) {
    const call = mockSocket.on.mock.calls.find(([e]) => e === event);
    if (!call) throw new Error(`No handler registered for '${event}'`);
    return call[1];
  }

  function getEmitCallback() {
    const args = mockSocket.emit.mock.calls[0];
    return args[args.length - 1];
  }

  describe('RECONNECT', () => {
    it('does not emit when gameStore.id is not set', () => {
      gameStore.id = null;
      getHandler('reconnect')();
      expect(mockSocket.emit).not.toHaveBeenCalled();
    });

    it('calls setGame on successful rejoin', () => {
      gameStore.id = 'game-123';
      jest.spyOn(gameStore, 'setGame');

      getHandler('reconnect')();

      const callback = getEmitCallback();
      const fakeGame = { id: 'game-123', systems: [], mitigations: [], injections: [] };
      callback({ error: null, game: fakeGame });

      expect(gameStore.setGame).toHaveBeenCalledWith(fakeGame);
    });

    it('calls popError on failed rejoin', () => {
      gameStore.id = 'game-123';
      jest.spyOn(gameStore, 'popError');

      getHandler('reconnect')();

      const callback = getEmitCallback();
      callback({ error: 'Game not found' });

      expect(gameStore.popError).toHaveBeenCalledWith('Game not found');
    });
  });

  describe('enterGame', () => {
    it('calls setGame on success', () => {
      jest.spyOn(gameStore, 'setGame');

      gameStore.actions.enterGame({ eventType: 'joinGame', gameId: 'game-456' });

      const fakeGame = { id: 'game-456', systems: [], mitigations: [], injections: [] };
      getEmitCallback()({ error: null, game: fakeGame });

      expect(gameStore.setGame).toHaveBeenCalledWith(fakeGame);
    });

    it('calls onSuccess with the backend game', () => {
      const onSuccess = jest.fn();
      gameStore.actions.enterGame({
        eventType: 'joinGame',
        gameId: 'game-456',
        onSuccess,
      });

      const fakeGame = {
        id: 'game-456',
        systems: [],
        mitigations: [],
        injections: [],
      };
      getEmitCallback()({ error: null, game: fakeGame });

      expect(onSuccess).toHaveBeenCalledWith(fakeGame);
    });

    it('resets loading to false after success', () => {
      gameStore.actions.enterGame({ eventType: 'joinGame', gameId: 'game-456' });
      expect(gameStore.loading).toBe(true);

      getEmitCallback()({ error: null, game: { id: 'game-456', systems: [], mitigations: [], injections: [] } });
      expect(gameStore.loading).toBe(false);
    });

    it('resets loading to false after error', () => {
      jest.spyOn(gameStore, 'popError');
      gameStore.actions.enterGame({ eventType: 'joinGame', gameId: 'game-456' });
      expect(gameStore.loading).toBe(true);

      getEmitCallback()({ error: 'Bad game ID' });
      expect(gameStore.loading).toBe(false);
    });

    it('calls onError when joining fails', () => {
      const onError = jest.fn();
      gameStore.actions.enterGame({
        eventType: 'joinGame',
        gameId: 'missing game',
        onError,
      });

      getEmitCallback()({ error: 'Game not found' });

      expect(onError).toHaveBeenCalledWith('Game not found');
    });

    it('saves gameId to localStorage when rememberGameId is true', () => {
      jest.spyOn(Storage.prototype, 'setItem');
      gameStore.actions.enterGame({ eventType: 'joinGame', gameId: 'game-456', rememberGameId: true });
      getEmitCallback()({ error: null, game: { id: 'game-456', systems: [], mitigations: [], injections: [] } });

      expect(localStorage.setItem).toHaveBeenCalledWith('gameId', 'game-456');
    });

    it('removes gameId from localStorage when rememberGameId is false', () => {
      jest.spyOn(Storage.prototype, 'removeItem');
      gameStore.actions.enterGame({ eventType: 'joinGame', gameId: 'game-456', rememberGameId: false });
      getEmitCallback()({ error: null, game: { id: 'game-456', systems: [], mitigations: [], injections: [] } });

      expect(localStorage.removeItem).toHaveBeenCalledWith('gameId');
    });
  });
});
