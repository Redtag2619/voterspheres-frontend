import { getTourSteps } from './platformTourSteps';

// A tour stop is now a complete page. Section guides stay inside that stop.
export function groupTourPages(expandedSteps) {
  const pages = [];
  let introduction = '';
  for (const step of expandedSteps) {
    if (step.section === 'Introduction') { introduction = step.narration; continue; }
    if (step.id.endsWith('-chapter')) continue;
    if (step.sectionDetail) {
      const page = pages.at(-1);
      if (page?.route === step.route) page.segments.push({ ...step });
      continue;
    }
    const overview = { ...step, sectionDetail: false };
    if (!pages.length && introduction) overview.narration = `${introduction} ${overview.narration}`;
    pages.push({ ...step, segments: [overview] });
  }
  return pages;
}

export function getUnifiedTourPages(mode = 'platform') {
  return groupTourPages(getTourSteps(mode));
}
