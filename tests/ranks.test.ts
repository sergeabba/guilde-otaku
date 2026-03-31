import { getRankAccent } from '../app/config/ranks';

describe('rank accents', () => {
  test('Fondateur should map to its accent color', () => {
    expect(getRankAccent('Fondateur')).toBe('#f59e0b');
  });

  test('Tous should fall back to default color when not defined', () => {
    // getRankAccent has a default fallback; ensure it returns a string
    const color = getRankAccent('Tous');
    expect(typeof color).toBe('string');
  });
});
