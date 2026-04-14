import type { RendererAppState } from './app-state.ts';
import { renderAppShell } from '../ui/app-shell-renderer.ts';
import { summarizeRuntimeHealth } from '../runtime/runtime-summary.ts';

export function renderRendererApp(state: RendererAppState): string {
  return renderAppShell({
    transcript: state.transcript,
    settings: state.settings,
    onboarding: state.onboarding,
    session: {
      adapter: state.settings.preferredCli,
      exitCode: 0,
      spokenSummary: state.sessionSummary,
    },
    runtimeSummary: summarizeRuntimeHealth([]),
    detail: null,
    history: [],
  });
}
