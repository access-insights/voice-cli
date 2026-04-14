import type { DetailRequestResult } from '../session/detail-requests.ts';

export function detailRequestToSpokenResponse(detail: DetailRequestResult | null): string {
  if (!detail) {
    return 'There are no additional details available yet.';
  }

  switch (detail.kind) {
    case 'raw-output':
      return `Here is the raw output: ${detail.text}`;
    case 'changed-files':
      return `Here are the changed files details: ${detail.text}`;
    case 'diff':
      return `Here is the diff summary: ${detail.text}`;
    default:
      return detail.text;
  }
}
