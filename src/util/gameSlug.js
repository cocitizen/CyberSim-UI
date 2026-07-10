const GAME_NAME_PATTERN = /^[\p{L}\p{M}\p{N} ]+$/u;

export const normalizeGameName = (gameName = '') =>
  gameName.normalize('NFC').trim().replace(/\s+/gu, ' ');

export const isValidGameName = (gameName) => {
  const normalized = normalizeGameName(gameName);
  return Boolean(normalized && GAME_NAME_PATTERN.test(normalized));
};

export const gameNameToGameSlug = (gameName) =>
  normalizeGameName(gameName).replace(/ /g, '-');

export const gameSlugToGameName = (gameSlug = '') =>
  gameSlug.replace(/-/g, ' ').normalize('NFC');

export const gameViewPath = (gameName, view = 'facilitator') =>
  `/games/${encodeURIComponent(gameNameToGameSlug(gameName))}/${view}`;
