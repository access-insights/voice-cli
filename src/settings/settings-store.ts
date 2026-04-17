export interface AppSettings {
  preferredCli: string;
  preferredVoice: string;
  speechRate: number;
  transcriptMode: 'summary-first' | 'verbatim-first';
  requireRiskConfirmation: boolean;
  onboardingProjectPath: string;
  onboardingProjectValid: boolean;
  onboardingCodexPath: string;
  onboardingCodexDetected: boolean;
}

export function defaultSettings(): AppSettings {
  return {
    preferredCli: 'codex',
    preferredVoice: 'default-male',
    speechRate: 1.2,
    transcriptMode: 'summary-first',
    requireRiskConfirmation: true,
    onboardingProjectPath: '',
    onboardingProjectValid: false,
    onboardingCodexPath: '',
    onboardingCodexDetected: false,
  };
}
