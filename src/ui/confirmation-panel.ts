import type { ConfirmationRequest } from '../safety/confirmation-flow.ts';

export function renderConfirmationPanel(request: ConfirmationRequest): string {
  return `
    <section aria-labelledby="confirm-heading">
      <h2 id="confirm-heading">Confirmation required</h2>
      <p><strong>Action:</strong> ${escapeHtml(request.actionLabel)}</p>
      <p><strong>Reason:</strong> ${escapeHtml(request.reason)}</p>
      <p><strong>Risk:</strong> ${escapeHtml(request.riskLevel)}</p>
      <p><strong>Explicit approval required:</strong> ${request.requiresExplicitApproval ? 'yes' : 'no'}</p>
    </section>
  `;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}
