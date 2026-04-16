import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('voiceCli', {
  session: {
    start: async (prompt) => ({ accepted: true, prompt }),
    sendInput: (input) => ({ accepted: true, echoedInput: input }),
    getHistory: () => [],
    getState: () => ({
      runtimeSummary: { status: 'ok', headline: 'Electron preload JS bridge ready.' },
      confirmation: null,
      controls: { canStartSession: true, canSendInput: false, currentInputDraft: '' },
    }),
    onEvent: () => {},
  },
  electron: {
    getShellSummary: () => ({ appName: 'voice-cli', windowTitle: 'voice-cli', startRoute: '/' }),
    getConfig: () => ({ appId: 'ai.access-insights.voice-cli', windowTitle: 'voice-cli', rendererEntryHtml: 'website/app-shell.html', preloadEntry: 'src/electron/preload.js' }),
  },
});
