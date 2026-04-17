const { contextBridge, ipcRenderer } = require('electron');

function now() {
  return new Date().toISOString();
}

function summarizeRuntimeHealth(events) {
  if (events.some((event) => event.type === 'prompt.detected')) {
    return {
      status: 'needs_confirmation',
      headline: 'The session is waiting for confirmation.',
    };
  }

  if (events.some((event) => event.type === 'error.detected')) {
    return {
      status: 'error',
      headline: 'The session encountered an error.',
    };
  }

  if (events.some((event) => event.type === 'session.progress')) {
    return {
      status: 'running',
      headline: 'The session is running.',
    };
  }

  return {
    status: 'ok',
    headline: 'The session completed without urgent intervention.',
  };
}

function createConfirmationRequest(reason) {
  return {
    id: `${Date.now()}-respond-to-cli-prompt`,
    actionLabel: 'Respond to CLI prompt',
    reason,
    riskLevel: 'high',
    requiresExplicitApproval: true,
  };
}

function detectConfirmationRequest(events) {
  const promptEvent = [...events].reverse().find((event) => event.type === 'prompt.detected');
  if (!promptEvent) return null;
  return createConfirmationRequest(promptEvent.raw || promptEvent.summary);
}

function createStreamEvent(source, chunk) {
  const raw = String(chunk).trim();

  if (/error|failed|exception/i.test(raw)) {
    return {
      type: 'error.detected',
      timestamp: now(),
      source,
      raw,
      summary: 'The CLI reported an error. Ask for details to hear the raw output.',
    };
  }

  if (/\?\s*$|continue\?|allow|approve|permission/i.test(raw)) {
    return {
      type: 'prompt.detected',
      timestamp: now(),
      source,
      raw,
      summary: 'The CLI is waiting for confirmation or input.',
    };
  }

  return {
    type: 'stream.chunk',
    timestamp: now(),
    source,
    raw,
    summary: raw.length > 160 ? `${raw.slice(0, 157)}...` : (raw || 'No output captured.'),
  };
}

function createRuntimeBridge() {
  const events = [];
  const eventListeners = [];
  let confirmation = null;
  let controls = { canStartSession: true, canSendInput: false, currentInputDraft: '' };
  let runtimeSummary = summarizeRuntimeHealth([]);

  function emit(event) {
    events.push(event);
    runtimeSummary = summarizeRuntimeHealth(events);
    confirmation = detectConfirmationRequest(events);
    controls = {
      canStartSession: true,
      canSendInput: confirmation !== null,
      currentInputDraft: confirmation ? 'yes' : '',
    };
    for (const listener of eventListeners) listener(event);
  }

  function replaceEvents(nextEvents) {
    events.length = 0;
    for (const event of nextEvents) {
      emit(event);
    }
    runtimeSummary = summarizeRuntimeHealth(events);
  }

  ipcRenderer.on('voice-cli:session-event', (_event, payload) => {
    if (!payload?.event) return;
    emit(payload.event);
  });

  return {
    async start(prompt) {
      if (process.env.VOICE_CLI_TEST_MODE === 'confirmation') {
        emit(createStreamEvent('stdout', `Started session for prompt: ${prompt}`));
        if (/approve|permission|allow/i.test(prompt)) {
          emit(createStreamEvent('stdout', 'Approve file changes?'));
        }
        const entry = {
          adapter: 'codex',
          exitCode: 0,
          spokenSummary: runtimeSummary.headline,
        };
        await ipcRenderer.invoke('voice-cli:persist-history', entry);
        return { accepted: true, prompt, runtimeSummary };
      }

      events.length = 0;
      runtimeSummary = summarizeRuntimeHealth(events);
      const result = await ipcRenderer.invoke('voice-cli:start-session', prompt);
      replaceEvents(Array.isArray(result?.events) ? result.events : []);
      runtimeSummary = result?.runtimeSummary ?? summarizeRuntimeHealth(events);
      return { accepted: true, prompt, runtimeSummary };
    },
    async sendInput(input) {
      if (!confirmation) {
        return { accepted: true, echoedInput: input };
      }

      const result = await ipcRenderer.invoke('voice-cli:respond-session', input);
      const existingEvents = [...events].filter((event) => event.type !== 'prompt.detected');
      const nextEvents = [...existingEvents, ...(Array.isArray(result?.events) ? result.events : [])];
      replaceEvents(nextEvents);
      runtimeSummary = result?.runtimeSummary ?? summarizeRuntimeHealth(events);
      return { accepted: true, echoedInput: input, runtimeSummary };
    },
    getHistory() {
      return ipcRenderer.invoke('voice-cli:load-history');
    },
    getSessionRecord(fileName) {
      return ipcRenderer.invoke('voice-cli:load-session-record', fileName);
    },
    getState() {
      return {
        runtimeSummary,
        confirmation,
        controls,
        events: [...events],
      };
    },
    onEvent(listener) {
      eventListeners.push(listener);
    },
  };
}

const runtimeBridge = createRuntimeBridge();

contextBridge.exposeInMainWorld('voiceCli', {
  session: {
    start: async (prompt) => runtimeBridge.start(prompt),
    sendInput: (input) => runtimeBridge.sendInput(input),
    getHistory: () => runtimeBridge.getHistory(),
    getSessionRecord: (fileName) => runtimeBridge.getSessionRecord(fileName),
    getState: () => runtimeBridge.getState(),
    onEvent: (listener) => runtimeBridge.onEvent(listener),
  },
  electron: {
    getShellSummary: () => ({ appName: 'voice-cli', windowTitle: 'voice-cli', startRoute: '/' }),
    getConfig: () => ({ appId: 'ai.access-insights.voice-cli', windowTitle: 'voice-cli', rendererEntryHtml: 'website/app-shell.html', preloadEntry: 'src/electron/preload.js' }),
    shouldAutoExit: () => process.env.VOICE_CLI_AUTO_EXIT === '1',
    getTestMode: () => process.env.VOICE_CLI_TEST_MODE || '',
  },
});
