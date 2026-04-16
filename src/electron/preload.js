import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { contextBridge } = require('electron');

const runtimeState = {
  runtimeSummary: { status: 'ok', headline: 'Electron preload JS bridge ready.' },
  confirmation: null,
  controls: { canStartSession: true, canSendInput: false, currentInputDraft: '' },
};
const history = [];
const eventListeners = [];

contextBridge.exposeInMainWorld('voiceCli', {
  session: {
    start: async (prompt) => {
      runtimeState.runtimeSummary = {
        status: 'ok',
        headline: `Started session for prompt: ${prompt}`,
      };
      const event = {
        type: 'stream.chunk',
        timestamp: new Date().toISOString(),
        summary: `Started session for prompt: ${prompt}`,
        raw: `Started session for prompt: ${prompt}`,
        source: 'stdout',
      };
      for (const listener of eventListeners) listener(event);
      history.unshift({
        fileName: `${Date.now()}-session.json`,
        adapter: 'codex',
        exitCode: 0,
        spokenSummary: runtimeState.runtimeSummary.headline,
        timestampGuess: `${Date.now()}`,
      });
      return { accepted: true, prompt };
    },
    sendInput: (input) => ({ accepted: true, echoedInput: input }),
    getHistory: () => history,
    getState: () => runtimeState,
    onEvent: (listener) => {
      eventListeners.push(listener);
    },
  },
  electron: {
    getShellSummary: () => ({ appName: 'voice-cli', windowTitle: 'voice-cli', startRoute: '/' }),
    getConfig: () => ({ appId: 'ai.access-insights.voice-cli', windowTitle: 'voice-cli', rendererEntryHtml: 'website/app-shell.html', preloadEntry: 'src/electron/preload.js' }),
    shouldAutoExit: () => process.env.VOICE_CLI_AUTO_EXIT === '1',
  },
});
