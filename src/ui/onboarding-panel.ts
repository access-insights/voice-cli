import type { FirstRunChecklistItem } from '../onboarding/first-run-flow.ts';

export function renderOnboardingPanel(items: FirstRunChecklistItem[]): string {
  const rows = items
    .map((item) => `<li>${item.completed ? '✅' : '⬜'} ${escapeHtml(item.label)}</li>`)
    .join('');

  return `
    <section aria-labelledby="onboarding-heading">
      <h2 id="onboarding-heading">First-run checklist</h2>
      <ol>${rows}</ol>
    </section>
  `;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}
