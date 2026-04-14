import type { SessionEvent } from '../session/event-types.ts';
import { summarizeRuntimeHealth } from '../runtime/runtime-summary.ts';

export interface RuntimeVoiceDecision {
  speak: boolean;
  kind: 'summary' | 'status';
  text: string;
}

export function decideRuntimeVoiceOutput(events: SessionEvent[]): RuntimeVoiceDecision {
  const summary = summarizeRuntimeHealth(events);

  if (summary.status === 'needs_confirmation') {
    return {
      speak: true,
      kind: 'status',
      text: 'The CLI is asking for confirmation before it can continue.',
    };
  }

  if (summary.status === 'error') {
    return {
      speak: true,
      kind: 'summary',
      text: 'The session hit an error. You can ask for the raw output.',
    };
  }

  return {
    speak: true,
    kind: 'summary',
    text: summary.headline,
  };
}
