import { createIpcContract } from './ipc-contract.ts';
import { createElectronMainHandlers } from './main-handlers.ts';

const handlers = createElectronMainHandlers();

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
    start: (prompt: string) => handlers.session.start(prompt),
    sendInput: (input: string) => handlers.session.sendInput(input),
    getHistory: () => handlers.session.getHistory(),
    getState: () => handlers.session.getState(),
    onEvent: (listener: Parameters<typeof handlers.session.onEvent>[0]) => handlers.session.onEvent(listener),
  },
  electron: {
    getShellSummary: () => handlers.electron.getShellSummary(),
    getConfig: () => handlers.electron.getConfig(),
  },
};

export function getBrowserSafePreloadApi() {
  return {
    session: preloadApi.session,
    electron: preloadApi.electron,
  };
}

export function exposePreloadApi(target: Record<string, unknown>) {
  target.voiceCli = getBrowserSafePreloadApi();
  return target;
}
