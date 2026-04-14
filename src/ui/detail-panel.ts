import type { DetailRequestResult } from '../session/detail-requests.ts';

export function renderDetailPanel(detail: DetailRequestResult | null): string {
  if (!detail) {
    return `
      <section aria-labelledby="detail-heading">
        <h2 id="detail-heading">Details</h2>
        <p>No extra detail requested yet.</p>
      </section>
    `;
  }

  return `
    <section aria-labelledby="detail-heading">
      <h2 id="detail-heading">Details: ${escapeHtml(detail.kind)}</h2>
      <pre>${escapeHtml(detail.text)}</pre>
    </section>
  `;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}
