import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import EnterGame from './EnterGame';

const mockEnterGame = jest.fn();

jest.mock('./GameStore', () => ({
  gameStore: {
    loading: false,
    actions: { enterGame: (...args) => mockEnterGame(...args) },
  },
}));

jest.mock('./StaticDataProvider', () => ({
  useStaticData: () => ({
    getTextWithSynonyms: (text) => text,
    scenarioName: 'Test scenario',
  }),
}));

jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
}));

const submitName = (name) => {
  fireEvent.change(screen.getByLabelText(/Game name/), {
    target: { value: name },
  });
  fireEvent.click(
    screen.getByRole('button', { name: /Create game/ }),
  );
};

describe('EnterGame game-name validation', () => {
  beforeEach(() => mockEnterGame.mockClear());

  it('shows a visible alert and does not create a game for a hyphenated name', () => {
    render(<EnterGame />);
    submitName('test-1');

    const alert = screen.getByRole('alert');
    expect(alert.textContent).toMatch(/no hyphens/);
    expect(
      screen
        .getByLabelText(/Game name/)
        .getAttribute('aria-describedby'),
    ).toBe('GameId-error');
    expect(mockEnterGame).not.toHaveBeenCalled();
  });

  it('clears the alert when the name is edited', () => {
    render(<EnterGame />);
    submitName('test-1');
    fireEvent.change(screen.getByLabelText(/Game name/), {
      target: { value: 'test 1' },
    });

    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.getByText(/Choose a memorable name/)).toBeTruthy();
  });

  it('creates a game for a valid name', () => {
    render(<EnterGame />);
    submitName('test 1');

    expect(screen.queryByRole('alert')).toBeNull();
    expect(mockEnterGame).toHaveBeenCalledWith(
      expect.objectContaining({ gameId: 'test 1' }),
    );
  });
});
