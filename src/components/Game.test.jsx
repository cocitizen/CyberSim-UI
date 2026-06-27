import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';

import Game from './Game';
import { gameStore } from './GameStore';
import { GameStates } from '../constants';

jest.mock('./EnterGame', () => () => <div>Enter Game</div>);
jest.mock('./Mitigations/Mitigations', () => () => <div>Mitigations</div>);
jest.mock('./Simulation/Simulation', () => () => <div>Simulation</div>);
jest.mock('./Projector', () => () => <div>Projector</div>);
jest.mock('./AfterActionReview/AfterActionReview', () => () => (
  <div>After Action Review</div>
));
jest.mock('./StaticDataProvider', () => ({
  useStaticData: jest.fn(),
}));
jest.mock('query-string', () => ({
  parse: jest.fn(() => ({})),
}));

const { useStaticData } = require('./StaticDataProvider');

describe('Game scenario mismatch guard', () => {
  beforeEach(() => {
    gameStore.ensureSocket = jest.fn();
    gameStore.socketConnected = true;
    gameStore.state = GameStates.SIMULATION;
    gameStore.scenarioSlug = 'city';
    gameStore.scenarioName = 'City Scenario';

    useStaticData.mockReturnValue({
      loading: false,
      scenarioSlug: 'county',
      scenarioName: 'County Scenario',
    });
  });

  afterEach(() => {
    cleanup();
    gameStore.state = undefined;
    gameStore.scenarioSlug = undefined;
    gameStore.scenarioName = undefined;
    jest.clearAllMocks();
  });

  it('shows an explicit alert instead of rendering gameplay when game and UI scenarios differ', () => {
    render(<Game />);

    expect(screen.getByText(/scenario mismatch/i)).toBeTruthy();
    expect(screen.getByText('City Scenario')).toBeTruthy();
    expect(screen.getByText('County Scenario')).toBeTruthy();
    expect(screen.queryByText('Simulation')).toBeNull();
  });
});
