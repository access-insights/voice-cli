const { contextBridge } = require('electron');

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

function buildPromptResponse(request, approved) {
  return {
    confirmationId: request.id,
    approved,
    responseText: approved ? 'yes\n' : 'no\n',
  };
}

function createRuntimeBridge() {
  const history = [];
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

  return {
    start(prompt) {
      emit(createStreamEvent('stdout', `Started session for prompt: ${prompt}`));
      if (/approve|permission|allow/i.test(prompt)) {
        emit(createStreamEvent('stdout', 'Approve file changes?'));
      }
      history.unshift({
        fileName: `${Date.now()}-session.json`,
        adapter: 'codex',
        exitCode: 0,
        spokenSummary: runtimeSummary.headline,
        timestampGuess: `${Date.now()}`,
      });
      return { accepted: true, prompt, runtimeSummary };
    },
    sendInput(input) {
      if (!confirmation) {
        return { accepted: true, echoedInput: input };
      }
      const approved = /^y(es)?$/i.test(String(input).trim());
      const response = buildPromptResponse(confirmation, approved);
      confirmation = null;
      controls = {
        canStartSession: true,
        canSendInput: false,
        currentInputDraft: response.responseText.trim(),
      };
      emit(createStreamEvent('stdout', approved ? 'Approval granted.' : 'Approval denied.'));
      return { accepted: true, echoedInput: response.responseText };
    },
    getHistory() {
      return history;
    },
    getState() {
      return {
        runtimeSummary,
        confirmation,
        controls,
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
    getState: () => runtimeBridge.getState(),
    onEvent: (listener) => runtimeBridge.onEvent(listener),
  },
  electron: {
    getShellSummary: () => ({ appName: 'voice-cli', windowTitle: 'voice-cli', startRoute: '/' }),
    getConfig: () => ({ appId: 'ai.access-insights.voice-cli', windowTitle: 'voice-cli', rendererEntryHtml: 'website/app-shell.html', preloadEntry: 'src/electron/preload.js' }),
    shouldAutoExit: () => process.env.VOICE_CLI_AUTO_EXIT === '1',
  },
});
