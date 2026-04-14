import type { SessionEvent } from './event-types.ts';

export interface DetailRequestResult {
  kind: 'raw-output' | 'changed-files' | 'diff';
  text: string;
}

export function getRawOutput(events: SessionEvent[]): DetailRequestResult | null {
  const lastRaw = [...events].reverse().find((event) => event.raw);
  if (!lastRaw?.raw) return null;
  return {
    kind: 'raw-output',
    text: lastRaw.raw,
  };
}

export function getChangedFiles(events: SessionEvent[]): DetailRequestResult | null {
  const event = events.find((item) => /changed files?|modified|updated/i.test(item.raw || item.summary));
  if (!event) return null;
  return {
    kind: 'changed-files',
    text: event.raw || event.summary,
  };
}

export function getDiffSummary(events: SessionEvent[]): DetailRequestResult | null {
  const event = events.find((item) => /diff/i.test(item.raw || item.summary));
  if (!event) return null;
  return {
    kind: 'diff',
    text: event.raw || event.summary,
  };
}
