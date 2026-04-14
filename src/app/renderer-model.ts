export interface TranscriptLine {
  role: 'user' | 'assistant' | 'system';
  mode: 'summary' | 'verbatim' | 'status';
  text: string;
}

export interface AppViewModel {
  currentProjectPath: string | null;
  selectedAdapter: string;
  transcript: TranscriptLine[];
  sessionStatus: 'idle' | 'running' | 'awaiting_confirmation' | 'error';
}

export function createInitialViewModel(): AppViewModel {
  return {
    currentProjectPath: null,
    selectedAdapter: 'codex',
    transcript: [
      {
        role: 'system',
        mode: 'status',
        text: 'Welcome to voice-cli. Select a project and start a CLI session.',
      },
    ],
    sessionStatus: 'idle',
  };
}
