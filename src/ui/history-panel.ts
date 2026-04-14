import type { StoredSessionSummary } from '../persistence/session-history.ts';

export function renderHistoryPanel(history: StoredSessionSummary[]): string {
  if (history.length === 0) {
    return `
      <section aria-labelledby="history-heading">
        <h2 id="history-heading">Session history</h2>
        <p>No prior sessions recorded yet.</p>
      </section>
    `;
  }

  const rows = history
    .map((item) => `<li>${escapeHtml(item.fileName)} | ${escapeHtml(item.adapter)} | exit ${item.exitCode} | ${escapeHtml(item.spokenSummary)}</li>`)
    .join('');

  return `
    <section aria-labelledby="history-heading">
      <h2 id="history-heading">Session history</h2>
      <ul>${rows}</ul>
    </section>
  `;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}
