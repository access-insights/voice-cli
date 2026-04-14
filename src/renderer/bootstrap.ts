import type { RendererAppState } from './app-state.ts';
import type { RendererSessionApi } from './live-renderer.ts';
import type { SessionEvent } from '../session/event-types.ts';
import { createSampleRendererState } from './sample-state.ts';
import { applySessionEventToTranscript, renderLiveRendererApp } from './live-renderer.ts';

export interface RendererBootstrapController {
  getState(): RendererAppState;
  render(): string;
  handleEvent(event: SessionEvent): string;
  subscribe(): void;
}

export function createRendererBootstrap(sessionApi: RendererSessionApi): RendererBootstrapController {
  let state = createSampleRendererState();

  return {
    getState() {
      return state;
    },

    render() {
      return renderLiveRendererApp(state, sessionApi);
    },

    handleEvent(event: SessionEvent) {
      state = {
        ...state,
        transcript: applySessionEventToTranscript(state.transcript, event),
        sessionSummary: sessionApi.getState().runtimeSummary.headline,
      };
      return renderLiveRendererApp(state, sessionApi);
    },

    subscribe() {
      sessionApi.onEvent((event) => {
        state = {
          ...state,
          transcript: applySessionEventToTranscript(state.transcript, event),
          sessionSummary: sessionApi.getState().runtimeSummary.headline,
        };
      });
    },
  };
}
