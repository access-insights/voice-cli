import type { SessionControlState } from '../renderer/session-controls.ts';

export function renderSessionControlsPanel(state: SessionControlState): string {
  return `
    <section aria-labelledby="controls-heading">
      <h2 id="controls-heading">Session controls</h2>
      <ul>
        <li>Can start session: ${state.canStartSession ? 'yes' : 'no'}</li>
        <li>Can send input: ${state.canSendInput ? 'yes' : 'no'}</li>
        <li>Current input draft: ${escapeHtml(state.currentInputDraft || '(empty)')}</li>
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
