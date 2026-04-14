import type { AppSettings } from '../settings/settings-store.ts';
import type { FirstRunChecklistItem } from '../onboarding/first-run-flow.ts';
import type { TranscriptLine } from '../app/renderer-model.ts';

export interface RendererAppState {
  settings: AppSettings;
  onboarding: FirstRunChecklistItem[];
  transcript: TranscriptLine[];
  sessionSummary: string;
}
