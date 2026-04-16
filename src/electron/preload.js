const { contextBridge } = require('electron');

const history = [];
const eventListeners = [];
const runtimeState = {
  runtimeSummary: { status: 'ok', headline: 'Electron preload JS runtime bridge ready.' },
  confirmation: null,
  controls: { canStartSession: true, canSendInput: false, currentInputDraft: '' },
};

contextBridge.exposeInMainWorld('voiceCli', {
  session: {
    start: async (prompt) => {
      runtimeState.runtimeSummary = {
        status: 'ok',
        headline: `Started session for prompt: ${prompt}`,
      };
      const entry = {
        fileName: `${Date.now()}-session.json`,
        adapter: 'codex',
        exitCode: 0,
        spokenSummary: runtimeState.runtimeSummary.headline,
        timestampGuess: `${Date.now()}`,
      };
      history.unshift(entry);
      const event = {
        type: 'stream.chunk',
        timestamp: new Date().toISOString(),
        summary: runtimeState.runtimeSummary.headline,
        raw: runtimeState.runtimeSummary.headline,
        source: 'stdout',
      };
      for (const listener of eventListeners) listener(event);
      return { accepted: true, prompt, entry };
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
