import type { AppSettings } from '../settings/settings-store.ts';

export interface FirstRunChecklistItem {
  id: string;
  label: string;
  completed: boolean;
}

export function createFirstRunChecklist(settings: AppSettings): FirstRunChecklistItem[] {
  return [
    { id: 'select-cli', label: `Select supported CLI (current: ${settings.preferredCli}).`, completed: Boolean(settings.preferredCli) },
    { id: 'choose-project', label: 'Choose a local project folder.', completed: false },
    { id: 'voice-test', label: `Test voice settings (${settings.preferredVoice}, rate ${settings.speechRate}).`, completed: false },
    { id: 'safety-review', label: 'Review confirmation and transcript preferences.', completed: settings.requireRiskConfirmation },
  ];
}
