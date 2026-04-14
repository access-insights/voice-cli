import type { SessionEvent } from '../session/event-types.ts';
import type { VoicePreferences } from './voice-preferences.ts';

export interface SpokenUtterance {
  kind: 'summary' | 'verbatim' | 'status';
  text: string;
}

export function eventToSpokenUtterance(event: SessionEvent, prefs: VoicePreferences): SpokenUtterance | null {
  if (!prefs.summariesEnabled) return null;

  switch (event.type) {
    case 'prompt.detected':
      return { kind: 'status', text: 'The CLI is asking for confirmation.' };
    case 'error.detected':
      return { kind: 'summary', text: 'The CLI reported an error. You can ask for the raw output.' };
    case 'stream.chunk':
      return { kind: 'summary', text: event.summary };
    default:
      return null;
  }
}
