export const POSTER_BASE_URL = 'https://image.tmdb.org/t/p/w300';

export function getDynamicFontSize(title) {
  const length = title.length;
  if (length <= 12) return '1.25rem';
  if (length <= 20) return '1.125rem';
  if (length <= 30) return '1rem';
  if (length <= 40) return '0.9rem';
  return '0.825rem';
}
