import type { TranscriptLine } from '../app/renderer-model.ts';
import type { RendererAppState } from './app-state.ts';
import type { SessionEvent } from '../session/event-types.ts';
import type { StoredSessionSummary } from '../persistence/session-history.ts';
import type { ConfirmationRequest } from '../safety/confirmation-flow.ts';
import type { SessionControlState } from './session-controls.ts';
import { eventToSpokenUtterance } from '../voice/speech-orchestrator.ts';
import { defaultVoicePreferences } from '../voice/voice-preferences.ts';
import { renderRendererApp } from './index.ts';

export interface RendererSessionApi {
  getHistory(): StoredSessionSummary[];
  getState(): {
    runtimeSummary: { status: 'ok' | 'needs_confirmation' | 'error'; headline: string };
    confirmation: ConfirmationRequest | null;
    controls: SessionControlState;
  };
  onEvent(listener: (event: SessionEvent) => void): void;
}

export function applySessionEventToTranscript(transcript: TranscriptLine[], event: SessionEvent): TranscriptLine[] {
  const utterance = eventToSpokenUtterance(event, defaultVoicePreferences());
  if (!utterance) return transcript;

  return [
    ...transcript,
    {
      role: 'assistant',
      mode: utterance.kind === 'status' ? 'status' : 'summary',
      text: utterance.text,
    },
  ];
}

export function renderLiveRendererApp(state: RendererAppState, sessionApi: RendererSessionApi): string {
  const runtimeState = sessionApi.getState();

  return renderRendererApp({
    ...state,
    sessionSummary: runtimeState.runtimeSummary.headline,
  }, {
    runtimeSummary: runtimeState.runtimeSummary,
    history: sessionApi.getHistory(),
    confirmation: runtimeState.confirmation,
    controls: runtimeState.controls,
  });
}
