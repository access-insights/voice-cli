import { join } from 'node:path';
import { createIpcContract } from './ipc-contract.ts';
import { createSessionIpcApi } from './session-ipc.ts';

const projectPath = process.cwd();
const transcriptDir = join(projectPath, '.voice-cli', 'sessions');
const sessionApi = createSessionIpcApi(projectPath, transcriptDir);

export const preloadApiContract = {
  session: {
    start: 'start a managed CLI session',
    sendInput: 'send input to the active CLI session',
    getTranscript: 'get current transcript and normalized events',
    getHistory: 'get prior session summaries',
    getState: 'get current runtime and control state',
    onEvent: 'subscribe to normalized session events',
  },
  voice: {
    speakSummary: 'speak a concise summary',
    speakVerbatim: 'speak raw output on demand',
  },
  settings: {
    load: 'load saved app settings',
    save: 'save app settings',
  },
  channels: createIpcContract(),
};

export const preloadApi = {
  session: {
    start: (prompt: string) => sessionApi.start(prompt),
    sendInput: (input: string) => sessionApi.sendInput(input),
    getHistory: () => sessionApi.getHistory(),
    getState: () => sessionApi.getState(),
    onEvent: (listener: Parameters<typeof sessionApi.onEvent>[0]) => sessionApi.onEvent(listener),
  },
};
