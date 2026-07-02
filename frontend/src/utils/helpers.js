export const clamp = (val, min, max) => Math.min(Math.max(val, min), max);

export const randomBetween = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

export const getThreatColor = (level) => {
  const map = {
    critical: 'var(--color-critical)',
    high:     'var(--color-high)',
    medium:   'var(--color-medium)',
    low:      'var(--color-low)',
  };
  return map[level] ?? 'var(--color-info)';
};

export const capitalize = (str) =>
  str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : '';
