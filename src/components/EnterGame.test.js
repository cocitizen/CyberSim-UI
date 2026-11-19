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

describe('EnterGame starting-conditions validation', () => {
  beforeEach(() => mockEnterGame.mockClear());

  const disclosure = () =>
    screen.getByRole('button', { name: /Starting conditions/ });
  const budgetInput = () => screen.getByLabelText(/Starting budget/);
  const pollInput = () =>
    screen.getByLabelText(/Starting poll percentage/);
  const setValue = (input, value) =>
    fireEvent.change(input, { target: { value } });

  it('shows a visible error, focuses the field, and does not create a game for an empty budget', () => {
    render(<EnterGame />);
    fireEvent.click(disclosure());
    setValue(budgetInput(), '');
    submitName('test 1');

    expect(screen.getByRole('alert').textContent).toMatch(
      /whole number/,
    );
    expect(budgetInput().getAttribute('aria-describedby')).toBe(
      'Budget-error',
    );
    expect(document.activeElement).toBe(budgetInput());
    expect(mockEnterGame).not.toHaveBeenCalled();
  });

  it('rejects a budget that is negative or not a whole number', () => {
    render(<EnterGame />);
    fireEvent.click(disclosure());

    setValue(budgetInput(), '-100');
    submitName('test 1');
    expect(screen.getByRole('alert').textContent).toMatch(
      /whole number/,
    );

    setValue(budgetInput(), '100.5');
    submitName('test 1');
    expect(screen.getByRole('alert').textContent).toMatch(
      /whole number/,
    );
    expect(mockEnterGame).not.toHaveBeenCalled();
  });

  it('rejects support that is empty or outside 0 to 100', () => {
    render(<EnterGame />);
    fireEvent.click(disclosure());

    setValue(pollInput(), '150');
    submitName('test 1');
    expect(screen.getByRole('alert').textContent).toMatch(
      /from 0 to 100/,
    );
    expect(pollInput().getAttribute('aria-describedby')).toBe(
      'PollPercentage-error',
    );
    expect(document.activeElement).toBe(pollInput());

    setValue(pollInput(), '');
    submitName('test 1');
    expect(screen.getByRole('alert').textContent).toMatch(
      /from 0 to 100/,
    );
    expect(mockEnterGame).not.toHaveBeenCalled();
  });

  it('reopens collapsed starting conditions to show the error', () => {
    render(<EnterGame />);
    fireEvent.click(disclosure());
    setValue(budgetInput(), '');
    fireEvent.click(disclosure());
    expect(screen.queryByLabelText(/Starting budget/)).toBeNull();

    submitName('test 1');

    expect(screen.getByRole('alert').textContent).toMatch(
      /whole number/,
    );
    expect(document.activeElement).toBe(budgetInput());
  });

  it('clears a field error when that field is edited', () => {
    render(<EnterGame />);
    fireEvent.click(disclosure());
    setValue(budgetInput(), '');
    submitName('test 1');
    setValue(budgetInput(), '5000');

    expect(screen.queryByRole('alert')).toBeNull();
    expect(budgetInput().getAttribute('aria-invalid')).toBe('false');
  });

  it('accepts 0 and off-step values, sending them as numbers', () => {
    render(<EnterGame />);
    fireEvent.click(disclosure());
    setValue(budgetInput(), '0');
    setValue(pollInput(), '0');
    submitName('test 1');

    expect(mockEnterGame).toHaveBeenLastCalledWith(
      expect.objectContaining({
        initialBudget: 0,
        initialPollPercentage: 0,
      }),
    );

    setValue(budgetInput(), '6050');
    setValue(pollInput(), '55.25');
    submitName('test 2');

    expect(mockEnterGame).toHaveBeenLastCalledWith(
      expect.objectContaining({
        initialBudget: 6050,
        initialPollPercentage: 55.25,
      }),
    );
  });

  it('does not check starting conditions when joining a game', () => {
    render(<EnterGame />);
    fireEvent.click(disclosure());
    setValue(budgetInput(), '');
    fireEvent.click(
      screen.getByRole('button', { name: 'Join a game' }),
    );
    setValue(screen.getByLabelText(/Game name/), 'test 1');
    fireEvent.click(
      screen.getByRole('button', { name: /Join game/ }),
    );

    expect(screen.queryByRole('alert')).toBeNull();
    expect(mockEnterGame).toHaveBeenCalledWith(
      expect.not.objectContaining({
        initialBudget: expect.anything(),
      }),
    );
  });
});
