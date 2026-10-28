// URL parameters launch or explicitly switch a tour. Page filter writers may
// remove them, but that must not erase an already-running session's mode.
export function nextTourSessionMode(currentMode, queryMode) {
  return queryMode === 'admin' || queryMode === 'platform' ? queryMode : currentMode;
}
