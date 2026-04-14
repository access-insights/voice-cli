export interface SessionStatusView {
  adapter: string;
  exitCode: number;
  spokenSummary: string;
}

export function renderSessionStatusPanel(view: SessionStatusView): string {
  return `
    <section aria-labelledby="session-heading">
      <h2 id="session-heading">Session status</h2>
      <ul>
        <li>Adapter: ${escapeHtml(view.adapter)}</li>
        <li>Exit code: ${view.exitCode}</li>
        <li>Summary: ${escapeHtml(view.spokenSummary)}</li>
      </ul>
    </section>
  `;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}
