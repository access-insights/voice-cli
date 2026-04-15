import { createIpcContract } from './ipc-contract.ts';
import { createElectronMainBootstrap } from './main-bootstrap.ts';

const bootstrap = createElectronMainBootstrap();

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
    start: (prompt: string) => bootstrap.sessionApi.start(prompt),
    sendInput: (input: string) => bootstrap.sessionApi.sendInput(input),
    getHistory: () => bootstrap.sessionApi.getHistory(),
    getState: () => bootstrap.sessionApi.getState(),
    onEvent: (listener: Parameters<typeof bootstrap.sessionApi.onEvent>[0]) => bootstrap.sessionApi.onEvent(listener),
  },
  electron: {
    getShellSummary: () => bootstrap.shell,
    getConfig: () => bootstrap.config,
  },
};

export function getBrowserSafePreloadApi() {
  return {
    session: preloadApi.session,
    electron: preloadApi.electron,
  };
}
