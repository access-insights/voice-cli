import type { RuntimeHealthSummary } from '../runtime/runtime-summary.ts';

export function renderRuntimeStatusBanner(summary: RuntimeHealthSummary): string {
  return `
    <section aria-labelledby="runtime-status-heading">
      <h2 id="runtime-status-heading">Runtime status</h2>
      <p><strong>Status:</strong> ${escapeHtml(summary.status)}</p>
      <p>${escapeHtml(summary.headline)}</p>
    </section>
  `;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}
