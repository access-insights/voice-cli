import type { SessionEvent, SessionSummary, StreamSource } from './event-types.ts';

function now(): string {
  return new Date().toISOString();
}

export function createStreamEvent(source: StreamSource, chunk: string): SessionEvent {
  const raw = chunk.trim();

  if (/error|failed|exception/i.test(raw)) {
    return {
      type: 'error.detected',
      timestamp: now(),
      source,
      raw,
      summary: 'The CLI reported an error. Ask for details to hear the raw output.',
    };
  }

  if (/\?\s*$|continue\?|allow|approve|permission/i.test(raw)) {
    return {
      type: 'prompt.detected',
      timestamp: now(),
      source,
      raw,
      summary: 'The CLI is waiting for confirmation or input.',
    };
  }

  return {
    type: 'stream.chunk',
    timestamp: now(),
    source,
    raw,
    summary: summarizeChunk(raw),
  };
}

export function summarizeChunk(raw: string): string {
  if (!raw) return 'No output captured.';
  if (/changed files?|diff/i.test(raw)) {
    return 'The CLI reported file changes. Ask for changed files or diff details.';
  }
  return raw.length > 160 ? `${raw.slice(0, 157)}...` : raw;
}

export function summarizeSessionEvents(events: SessionEvent[]): SessionSummary {
  const last = events.at(-1);
  const hasError = events.some((event) => event.type === 'error.detected');
  const hasPrompt = events.some((event) => event.type === 'prompt.detected');

  if (hasError) {
    return {
      status: 'failed',
      headline: 'The session reported an error.',
      detailsAvailable: true,
    };
  }

  if (hasPrompt) {
    return {
      status: 'running',
      headline: 'The session is waiting for confirmation.',
      detailsAvailable: true,
    };
  }

  return {
    status: 'completed',
    headline: last?.summary ?? 'The session completed without notable output.',
    detailsAvailable: events.some((event) => Boolean(event.raw)),
  };
}
