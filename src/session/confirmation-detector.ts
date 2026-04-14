import type { SessionEvent } from './event-types.ts';
import { createConfirmationRequest, type ConfirmationRequest } from '../safety/confirmation-flow.ts';

export function detectConfirmationRequest(events: SessionEvent[]): ConfirmationRequest | null {
  const promptEvent = [...events].reverse().find((event) => event.type === 'prompt.detected');
  if (!promptEvent) return null;

  return createConfirmationRequest(
    'Respond to CLI prompt',
    promptEvent.raw || promptEvent.summary,
    'high'
  );
}
