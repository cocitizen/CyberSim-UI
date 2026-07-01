import {
  gameNameToGameSlug,
  gameSlugToGameName,
  gameViewPath,
  isValidGameName,
  normalizeGameName,
} from './gameSlug';

describe('game slug helpers', () => {
  it('normalizes whitespace and preserves Unicode game names', () => {
    expect(normalizeGameName('  Équipe   東京  ')).toBe('Équipe 東京');
    expect(gameNameToGameSlug('  Équipe   東京  ')).toBe(
      'Équipe-東京',
    );
  });

  it('maps game slugs back to backend game names', () => {
    expect(gameSlugToGameName('Tuesday-workshop')).toBe(
      'Tuesday workshop',
    );
  });

  it('accepts letters, combining marks, numbers, and spaces', () => {
    expect(isValidGameName('Équipe 7 東京')).toBe(true);
    expect(isValidGameName('Cafe\u0301')).toBe(true);
  });

  it('rejects punctuation so hyphens remain an unambiguous space marker', () => {
    expect(isValidGameName('Tuesday-workshop')).toBe(false);
    expect(isValidGameName('Game!')).toBe(false);
  });

  it('builds an encoded route for a game view', () => {
    expect(gameViewPath('Équipe 東京', 'projector')).toBe(
      '/games/%C3%89quipe-%E6%9D%B1%E4%BA%AC/projector',
    );
  });
});
