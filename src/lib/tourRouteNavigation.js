// Navigate once for a selected stop; a tour never owns ordinary site navigation.
export function tourRouteDecision(previous, { pageId, pathname, target, retry = 0 }) {
  const key = JSON.stringify([pageId, target, retry]);
  if (pathname === target) return { action: 'play', state: { key, arrived: true } };
  if (!previous || previous.key !== key) {
    return { action: 'navigate', state: { key, arrived: false } };
  }
  if (previous.arrived) return { action: 'leave', state: previous };
  return { action: 'blocked', state: previous };
}
