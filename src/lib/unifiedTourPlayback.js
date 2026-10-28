const clean = text => String(text || '').replace(/\s+/g, ' ').trim();

// Match narration to the DOM order actually visible to this user. Never open tabs,
// submit controls, or speak hidden record content to manufacture a tour target.
export function collectVisiblePageSegments(page, resolveTarget, follows) {
  const visible = page.segments.map(segment => ({ ...segment, element: resolveTarget(segment) }))
    .filter(segment => segment.element);
  const overview = visible.filter(segment => !segment.sectionDetail);
  const details = visible.filter(segment => segment.sectionDetail);
  details.sort((a, b) => a.element === b.element ? 0 : follows(a.element, b.element));
  return [...overview, ...details];
}

export function sectionNarration(segment, index, total, pageValue) {
  let narration = clean(segment.narration);
  const heading = clean(segment.heading);
  if (segment.sectionDetail && narration.toLowerCase().startsWith(`${heading.toLowerCase()}.`)) {
    narration = narration.slice(heading.length + 1).trim();
  }
  const bridge = !segment.sectionDetail ? '' : index === 1
    ? `Start with ${heading}.` : `${['Next, review', 'Continue to', 'Now consider'][(index - 2) % 3]} ${heading}.`;
  return clean([bridge, narration, segment.sectionDetail || total === 1 ? segment.value : '',
    index === total - 1 && segment.sectionDetail && pageValue
      ? `Together, these sections serve one purpose. ${pageValue}` : '',
  ].filter(Boolean).join(' '));
}

// Keep the existing voice API's per-request size bounded without truncating a page.
export function splitNarration(text, max = 1700) {
  const remainingWords = clean(text).split(' ').filter(Boolean);
  const chunks = [];
  let current = '';
  for (const word of remainingWords) {
    if (word.length > max) throw new Error('Narration contains an oversized word.');
    if (current && current.length + word.length + 1 > max) { chunks.push(current); current = ''; }
    current = current ? `${current} ${word}` : word;
  }
  if (current) chunks.push(current);
  return chunks;
}

// One-ahead preparation overlaps voice generation with playback. There is no
// per-section Next, route transition, or artificial inter-section delay.
export async function playUnifiedPage({ segments, prepare, present, play, dispose, isCurrent, start = 0 }) {
  if (!segments.length || start >= segments.length) return true;
  const safePrepare = segment => Promise.resolve().then(() => prepare(segment))
    .then(resource => ({ resource }), error => ({ error }));
  let pending = safePrepare(segments[start]);
  let resource;
  try {
    for (let index = start; index < segments.length; index += 1) {
      const ready = await pending;
      pending = null;
      if (ready.error) { if (isCurrent()) throw ready.error; return false; }
      resource = ready.resource;
      if (!isCurrent()) return false;
      // Prepare at most one section ahead. Catch is attached immediately.
      if (index + 1 < segments.length) pending = safePrepare(segments[index + 1]);
      await present(segments[index], index);
      if (!isCurrent()) return false;
      await play(resource, segments[index], index);
      dispose(resource); resource = undefined;
      if (!isCurrent()) return false;
    }
    return true;
  } finally {
    if (resource !== undefined) dispose(resource);
    if (pending) void pending.then(ready => { if (ready.resource !== undefined) dispose(ready.resource); });
  }
}
