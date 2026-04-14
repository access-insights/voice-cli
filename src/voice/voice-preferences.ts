export interface VoicePreferences {
  ttsVoice: string;
  ttsRate: number;
  language: string;
  summariesEnabled: boolean;
  verbatimOnDemandOnly: boolean;
}

export function defaultVoicePreferences(): VoicePreferences {
  return {
    ttsVoice: 'default-male',
    ttsRate: 1.2,
    language: 'en-US',
    summariesEnabled: true,
    verbatimOnDemandOnly: true,
  };
}
