import { createInitialViewModel } from '../app/renderer-model.ts';
import { defaultSettings } from '../settings/settings-store.ts';
import { createFirstRunChecklist } from '../onboarding/first-run-flow.ts';
import type { RendererAppState } from './app-state.ts';

export function createSampleRendererState(): RendererAppState {
  const settings = defaultSettings();
  const model = createInitialViewModel();

  return {
    settings,
    onboarding: createFirstRunChecklist(settings),
    transcript: model.transcript,
    sessionSummary: 'No session has been launched yet.',
  };
}
