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

function cleanRawOutput(raw) {
  const lines = String(raw)
    .split('\n')
    .filter((line) => {
      const trimmed = line.trim();
      if (!trimmed) return false;
      if (/^OpenAI Codex v/i.test(trimmed)) return false;
      if (/^workdir:/i.test(trimmed)) return false;
      if (/^model:/i.test(trimmed)) return false;
      if (/^provider:/i.test(trimmed)) return false;
      if (/^approval:/i.test(trimmed)) return false;
      if (/^sandbox:/i.test(trimmed)) return false;
      if (/^reasoning effort:/i.test(trimmed)) return false;
      if (/^reasoning summaries:/i.test(trimmed)) return false;
      if (/^session id:/i.test(trimmed)) return false;
      if (/^tokens used/i.test(trimmed)) return false;
      if (/^Reading additional input from stdin/i.test(trimmed)) return false;
      if (/^warning: Codex's Linux sandbox/i.test(trimmed)) return false;
      if (/^-{4,}$/.test(trimmed)) return false;
      return true;
    });

  return lines.join('\n').trim();
}

function classifyStreamChunk(source, raw, fallbackSummary) {
  const cleaned = cleanRawOutput(raw);
  const lines = cleaned.split('\n').map((line) => line.trim()).filter(Boolean);

  if (source === 'stderr' && lines.length) {
    const userIndex = lines.indexOf('user');
    const codexIndex = lines.indexOf('codex');

    if (userIndex !== -1 && codexIndex !== -1) {
      const userText = lines.slice(userIndex + 1, codexIndex).join('\n').trim();
      const assistantText = lines.slice(codexIndex + 1).join('\n').trim();
      const entries = [];
      if (userText) entries.push({ kind: 'user', source: 'user', summary: userText, raw: userText });
      if (assistantText) entries.push({ kind: 'assistant', source: 'assistant', summary: assistantText, raw: assistantText });
      if (entries.length) return entries;
    }
  }

  return [{
    kind: source === 'stderr' ? 'tool' : 'assistant',
    source,
    summary: cleaned || fallbackSummary || 'No summary',
    raw: cleaned || raw || '',
  }];
}

function shapeTranscript(events) {
  const entries = [];

  for (const event of Array.isArray(events) ? events : []) {
    if (event.type === 'stream.chunk') {
      const chunkEntries = classifyStreamChunk(event.source || 'stdout', event.raw || '', event.summary || 'No summary');
      for (const chunkEntry of chunkEntries) {
        const last = entries.at(-1);
        if (last && last.kind === chunkEntry.kind && last.source === chunkEntry.source) {
          last.summary = `${last.summary}\n${chunkEntry.summary}`.trim();
          last.raw = `${last.raw || ''}\n${chunkEntry.raw || ''}`.trim();
        } else {
          entries.push(chunkEntry);
        }
      }
      continue;
    }

    if (event.type === 'session.progress') {
      entries.push({
        kind: 'lifecycle',
        source: 'system',
        summary: event.summary || 'Session is running.',
        raw: '',
      });
      continue;
    }

    if (event.type === 'prompt.detected' || event.type === 'error.detected') {
      entries.push({
        kind: event.type === 'prompt.detected' ? 'prompt' : 'error',
        source: event.source || 'system',
        summary: event.summary || 'No summary',
        raw: cleanRawOutput(event.raw || '') || event.raw || '',
      });
      continue;
    }

    if (event.type === 'session.started' || event.type === 'session.exited') {
      entries.push({
        kind: 'lifecycle',
        source: 'system',
        summary: event.summary || 'No summary',
        raw: '',
      });
    }
  }

  return entries;
}

function createRuntimeBridge() {
  const events = [];
  const eventListeners = [];
  let confirmation = null;
  let controls = { canStartSession: true, canSendInput: false, currentInputDraft: '' };
  let runtimeSummary = summarizeRuntimeHealth([]);
  let transcript = [];

  function emit(event) {
    events.push(event);
    transcript = shapeTranscript(events);
    runtimeSummary = summarizeRuntimeHealth(events);
    confirmation = detectConfirmationRequest(events);
    controls = {
      canStartSession: true,
      canSendInput: confirmation !== null,
      currentInputDraft: confirmation ? 'yes' : '',
    };
    for (const listener of eventListeners) listener(event);
  }

  function replaceEvents(nextEvents, nextTranscript) {
    events.length = 0;
    for (const event of nextEvents) {
      emit(event);
    }
    transcript = Array.isArray(nextTranscript) && nextTranscript.length ? nextTranscript : shapeTranscript(events);
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
      transcript = [];
      runtimeSummary = summarizeRuntimeHealth(events);
      const result = await ipcRenderer.invoke('voice-cli:start-session', prompt);
      replaceEvents(Array.isArray(result?.events) ? result.events : [], Array.isArray(result?.transcript) ? result.transcript : []);
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
      replaceEvents(nextEvents, Array.isArray(result?.transcript) ? result.transcript : []);
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
        transcript: [...transcript],
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
  voice: {
    speakText: (text, options = {}) => ipcRenderer.invoke('voice-cli:speak-text', { text, rate: options.rate }),
    transcribeAudio: (audioPath, options = {}) => ipcRenderer.invoke('voice-cli:transcribe-audio', {
      audioPath,
      model: options.model,
      language: options.language,
      prompt: options.prompt,
      outPath: options.outPath,
    }),
    loadTranscriptionText: (filePath) => ipcRenderer.invoke('voice-cli:load-transcription-text', { filePath }),
    persistCapturedAudio: (bufferBase64, options = {}) => ipcRenderer.invoke('voice-cli:persist-captured-audio', {
      bufferBase64,
      extension: options.extension,
      mimeType: options.mimeType,
    }),
  },
  onboarding: {
    detectCodexCli: () => ipcRenderer.invoke('voice-cli:detect-codex-cli'),
    validateProjectPath: (projectPath) => ipcRenderer.invoke('voice-cli:validate-project-path', { projectPath }),
    loadSettings: () => ipcRenderer.invoke('voice-cli:load-settings'),
    saveSettings: (settings) => ipcRenderer.invoke('voice-cli:save-settings', settings),
  },
  electron: {
    getShellSummary: () => ({ appName: 'voice-cli', windowTitle: 'voice-cli', startRoute: '/' }),
    getConfig: () => ({ appId: 'ai.access-insights.voice-cli', windowTitle: 'voice-cli', rendererEntryHtml: 'website/app-shell.html', preloadEntry: 'src/electron/preload.js' }),
    shouldAutoExit: () => process.env.VOICE_CLI_AUTO_EXIT === '1',
    getTestMode: () => process.env.VOICE_CLI_TEST_MODE || '',
  },
});
