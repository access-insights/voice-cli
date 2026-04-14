import type { RendererAppState } from './app-state.ts';
import { renderAppShell } from '../ui/app-shell-renderer.ts';
import { summarizeRuntimeHealth, type RuntimeHealthSummary } from '../runtime/runtime-summary.ts';
import type { StoredSessionSummary } from '../persistence/session-history.ts';
import type { ConfirmationRequest } from '../safety/confirmation-flow.ts';
import type { SessionControlState } from './session-controls.ts';

export function renderRendererApp(state: RendererAppState, options?: {
  runtimeSummary?: RuntimeHealthSummary;
  history?: StoredSessionSummary[];
  confirmation?: ConfirmationRequest | null;
  controls?: SessionControlState;
}): string {
  return renderAppShell({
    transcript: state.transcript,
    settings: state.settings,
    onboarding: state.onboarding,
    session: {
      adapter: state.settings.preferredCli,
      exitCode: 0,
      spokenSummary: state.sessionSummary,
    },
    runtimeSummary: options?.runtimeSummary ?? summarizeRuntimeHealth([]),
    detail: null,
    history: options?.history ?? [],
    confirmation: options?.confirmation ?? null,
    controls: options?.controls,
  });
}
