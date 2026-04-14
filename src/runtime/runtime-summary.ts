import type { SessionEvent } from '../session/event-types.ts';

export interface RuntimeHealthSummary {
  status: 'ok' | 'needs_confirmation' | 'error';
  headline: string;
}

export function summarizeRuntimeHealth(events: SessionEvent[]): RuntimeHealthSummary {
  if (events.some((event) => event.type === 'prompt.detected')) {
    return {
      status: 'needs_confirmation',
      headline: 'The session is waiting for confirmation.',
    };
  }

  if (events.some((event) => event.type === 'error.detected')) {
    return {
      status: 'error',
      headline: 'The session encountered an error.',
    };
  }

  return {
    status: 'ok',
    headline: 'The session completed without urgent intervention.',
  };
}
