import { createIpcContract } from './ipc-contract.ts';

export const preloadApiContract = {
  session: {
    start: 'start a managed CLI session',
    sendInput: 'send input to the active CLI session',
    getTranscript: 'get current transcript and normalized events',
    getHistory: 'get prior session summaries',
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
