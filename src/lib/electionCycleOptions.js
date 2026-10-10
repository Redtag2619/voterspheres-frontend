export function cycleOptions({historical = false, selected} = {}) {
  const now = new Date().getFullYear();
  const current = Math.max(2026, now + now % 2);
  const years = new Set(Array.from({length: 8}, (_, i) => current + i * 2).filter(y => y <= 2200));
  if (historical) [2020, 2022, 2024, 2026].forEach(y => years.add(y));
  const year = Number(selected);
  if (Number.isInteger(year) && year >= (historical ? 2000 : 2026) && year <= 2200 && year % 2 === 0) years.add(year);
  return [...years].sort((a,b) => b-a);
}
export function initialCycle(key, {historical = false} = {}) {
  const fallback = Math.max(2026, new Date().getFullYear() + new Date().getFullYear() % 2);
  try {
    const value = new URLSearchParams(window.location.search).get('cycle') || localStorage.getItem('vs-cycle:' + key);
    const year = Number(value);
    return Number.isInteger(year) && year >= (historical ? 2000 : 2026) && year <= 2200 && year % 2 === 0 ? year : fallback;
  } catch { return fallback; }
}
