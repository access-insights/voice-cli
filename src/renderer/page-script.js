function writePageDiagnostic(message) {
  try {
    console.log(`[voice-cli page] ${message}`);
  } catch {
    // no-op
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

const viewState = {
  isStartingSession: false,
  isSessionRunning: false,
  activePrompt: '',
  runStartedAt: 0,
  timingIntervalId: null,
  lastOutcome: 'idle',
  selectedHistoryFile: '',
  selectedRecord: null,
};

function getElapsedLabel() {
  if (!viewState.runStartedAt) return 'Not running';
  const elapsedMs = Math.max(0, Date.now() - viewState.runStartedAt);
  return `${(elapsedMs / 1000).toFixed(1)}s`;
}

function renderBanner(runtimeSummary) {
  if (viewState.isStartingSession) {
    return '<p><strong>Starting session...</strong> Initializing the CLI session.</p>';
  }

  if (viewState.isSessionRunning) {
    return '<p><strong>Session running.</strong> Live updates will appear as the session progresses.</p>';
  }

  if (runtimeSummary?.status === 'error') {
    return '<p><strong>Session error.</strong> Review the transcript for stderr and raw output.</p>';
  }

  if (viewState.lastOutcome === 'completed') {
    return '<p><strong>Session completed.</strong> Latest results are shown below.</p>';
  }

  return '<p><strong>Ready.</strong> Start a session to view transcript output here.</p>';
}

function renderStatusBadge(runtimeSummary) {
  const status = viewState.isStartingSession || viewState.isSessionRunning
    ? 'running'
    : (runtimeSummary?.status || 'ok');

  const label = status === 'error'
    ? 'Error'
    : status === 'needs_confirmation'
      ? 'Needs confirmation'
      : status === 'running'
        ? 'Running'
        : 'Completed';

  return `<p><strong>Status:</strong> ${label}</p>`;
}

function toTranscriptEntries(runtimeState) {
  if (Array.isArray(runtimeState?.transcript) && runtimeState.transcript.length) {
    return runtimeState.transcript;
  }
  return [];
}

function renderRunSummary(runtimeState, history) {
  const latest = history[0] || null;
  const events = Array.isArray(runtimeState.events) ? runtimeState.events : [];
  const adapter = latest?.adapter || 'codex';
  const exitCode = latest?.exitCode ?? 'n/a';
  const eventCount = events.length;
  const activePrompt = viewState.activePrompt || 'No active prompt';

  return `
    <section aria-labelledby="run-summary-heading">
      <h2 id="run-summary-heading">Latest run</h2>
      <ul>
        <li><strong>Adapter:</strong> ${escapeHtml(adapter)}</li>
        <li><strong>Exit code:</strong> ${escapeHtml(exitCode)}</li>
        <li><strong>Events:</strong> ${escapeHtml(eventCount)}</li>
        <li><strong>Elapsed:</strong> ${escapeHtml(getElapsedLabel())}</li>
        <li><strong>Prompt:</strong> ${escapeHtml(activePrompt)}</li>
        <li><strong>Summary:</strong> ${escapeHtml(runtimeState.runtimeSummary.headline)}</li>
      </ul>
    </section>
  `;
}

function renderTranscript(entries) {
  if (!entries.length) {
    return '<p>No transcript captured yet.</p>';
  }

  return `
    <ol>
      ${entries.map((entry) => {
        const label = entry.kind === 'prompt'
          ? 'Prompt'
          : entry.kind === 'error'
            ? 'Error'
            : entry.kind === 'lifecycle'
              ? 'System'
              : entry.kind === 'user'
                ? 'User'
                : entry.kind === 'assistant'
                  ? 'Assistant'
                  : 'Tool';

        const content = `
          <strong>${escapeHtml(label)}</strong>
          <p>${escapeHtml(entry.summary)}</p>
          ${entry.raw && entry.raw !== entry.summary ? `<details><summary>Raw output</summary><pre>${escapeHtml(entry.raw)}</pre></details>` : ''}
        `;

        if (entry.kind === 'lifecycle') {
          return `<li><details><summary>${escapeHtml(label)} event</summary>${content}</details></li>`;
        }

        return `<li>${content}</li>`;
      }).join('')}
    </ol>
  `;
}

function renderSelectedRecord() {
  if (!viewState.selectedRecord) {
    return '<p>No saved run selected.</p>';
  }

  const record = viewState.selectedRecord;
  const transcriptEntries = toTranscriptEntries(record);

  return `
    <section aria-labelledby="saved-run-heading">
      <h2 id="saved-run-heading">Saved run details</h2>
      <p><strong>File:</strong> ${escapeHtml(record.fileName)}</p>
      <p><strong>Summary:</strong> ${escapeHtml(record.spokenSummary)}</p>
      <p><strong>Exit code:</strong> ${escapeHtml(record.exitCode)}</p>
      <p><strong>Status:</strong> ${escapeHtml(record.runtimeSummary?.headline || 'No runtime summary')}</p>
      <button type="button" id="clear-history-selection-button">Back to live view</button>
      ${renderTranscript(transcriptEntries)}
    </section>
  `;
}

function renderHistory(history) {
  if (!history.length) {
    return '<p>No saved sessions yet.</p>';
  }

  return `
    <ul>
      ${history.map((item) => {
        const isSelected = item.fileName === viewState.selectedHistoryFile;
        return `
          <li>
            <button type="button" class="history-load-button" data-file-name="${escapeHtml(item.fileName)}">
              ${isSelected ? 'Selected' : 'Load'}
            </button>
            <strong>${isSelected ? '▶ ' : ''}</strong>${escapeHtml(item.fileName)} | ${escapeHtml(item.adapter)} | exit ${escapeHtml(item.exitCode)} | ${escapeHtml(item.spokenSummary)}
          </li>
        `;
      }).join('')}
    </ul>
  `;
}

function renderShell(runtimeState, history) {
  const confirmationSection = runtimeState.confirmation ? `
    <section aria-labelledby="confirmation-heading">
      <h2 id="confirmation-heading">Confirmation required</h2>
      <p><strong>Action:</strong> ${escapeHtml(runtimeState.confirmation.actionLabel)}</p>
      <p><strong>Reason:</strong> ${escapeHtml(runtimeState.confirmation.reason)}</p>
      <form id="session-input-form">
        <label for="session-input-response">Response</label>
        <input id="session-input-response" name="response" type="text" value="${escapeHtml(runtimeState.controls.currentInputDraft || 'yes')}" />
        <button id="session-input-button" type="submit">Send response</button>
      </form>
    </section>
  ` : '';

  const transcriptEntries = toTranscriptEntries(runtimeState);
  const startButtonLabel = viewState.isStartingSession || viewState.isSessionRunning ? 'Running…' : 'Start session';
  const startDisabled = viewState.isStartingSession || viewState.isSessionRunning ? 'disabled' : '';

  return `
    <section aria-labelledby="runtime-heading">
      <h2 id="runtime-heading">Runtime status</h2>
      ${renderBanner(runtimeState.runtimeSummary)}
      ${renderStatusBadge(runtimeState.runtimeSummary)}
      <p>${escapeHtml(runtimeState.runtimeSummary.headline)}</p>
    </section>
    ${renderRunSummary(runtimeState, history)}
    <section aria-labelledby="controls-heading">
      <h2 id="controls-heading">Session controls</h2>
      <form id="session-start-form">
        <label for="session-start-prompt">Start prompt</label>
        <input id="session-start-prompt" name="prompt" type="text" value="Summarize the current project state." ${startDisabled} />
        <button id="session-start-button" type="submit" ${startDisabled}>${startButtonLabel}</button>
      </form>
    </section>
    ${confirmationSection}
    <section aria-labelledby="transcript-heading">
      <h2 id="transcript-heading">Live transcript</h2>
      ${renderTranscript(transcriptEntries)}
    </section>
    <section aria-labelledby="history-heading">
      <h2 id="history-heading">Session history</h2>
      <p>${history.length} recorded sessions.</p>
      ${renderHistory(history)}
    </section>
    ${renderSelectedRecord()}
  `;
}

function stopTimingRefresh() {
  if (viewState.timingIntervalId) {
    clearInterval(viewState.timingIntervalId);
    viewState.timingIntervalId = null;
  }
}

function startTimingRefresh(target) {
  stopTimingRefresh();
  viewState.timingIntervalId = setInterval(() => {
    if (!viewState.isStartingSession && !viewState.isSessionRunning) {
      stopTimingRefresh();
      return;
    }
    renderIntoTarget(target).catch(() => {});
  }, 250);
}

async function maybeAutoSelectLatestHistory() {
  if (!viewState.lastOutcome || viewState.lastOutcome !== 'completed') return;
  const history = await window.voiceCli?.session?.getHistory?.();
  if (!Array.isArray(history) || !history.length) return;
  const latest = history[0];
  if (!latest?.fileName) return;
  viewState.selectedHistoryFile = latest.fileName;
  viewState.selectedRecord = await window.voiceCli?.session?.getSessionRecord?.(latest.fileName);
}

async function bindInteractions(target) {
  const form = document.getElementById('session-start-form');
  const promptInput = document.getElementById('session-start-prompt');
  if (form) {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (viewState.isStartingSession || viewState.isSessionRunning) return;
      const prompt = promptInput && 'value' in promptInput && typeof promptInput.value === 'string'
        ? promptInput.value
        : 'Summarize the current project state.';
      viewState.isStartingSession = true;
      viewState.isSessionRunning = false;
      viewState.activePrompt = prompt;
      viewState.runStartedAt = Date.now();
      viewState.lastOutcome = 'running';
      startTimingRefresh(target);
      await renderIntoTarget(target);
      writePageDiagnostic(`Submitting prompt: ${prompt}`);
      try {
        await window.voiceCli?.session?.start?.(prompt);
        viewState.lastOutcome = 'completed';
        await maybeAutoSelectLatestHistory();
      } catch (error) {
        viewState.lastOutcome = 'error';
        throw error;
      } finally {
        viewState.isStartingSession = false;
        viewState.isSessionRunning = false;
        stopTimingRefresh();
        await renderIntoTarget(target);
      }
      writePageDiagnostic('Runtime shell rerendered after start.');
    });
  }

  const inputForm = document.getElementById('session-input-form');
  const responseInput = document.getElementById('session-input-response');
  if (inputForm) {
    inputForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const response = responseInput && 'value' in responseInput && typeof responseInput.value === 'string'
        ? responseInput.value
        : 'yes';
      writePageDiagnostic(`Submitting confirmation response: ${response}`);
      await window.voiceCli?.session?.sendInput?.(response);
      viewState.lastOutcome = 'completed';
      viewState.isSessionRunning = false;
      await maybeAutoSelectLatestHistory();
      await renderIntoTarget(target);
      writePageDiagnostic('Runtime shell rerendered after input response.');
    });
  }

  document.querySelectorAll('.history-load-button').forEach((button) => {
    button.addEventListener('click', async () => {
      const fileName = button.getAttribute('data-file-name') || '';
      if (!fileName) return;
      viewState.selectedHistoryFile = fileName;
      viewState.selectedRecord = await window.voiceCli?.session?.getSessionRecord?.(fileName);
      await renderIntoTarget(target);
      writePageDiagnostic(`Loaded saved session record: ${fileName}`);
    });
  });

  const clearButton = document.getElementById('clear-history-selection-button');
  if (clearButton) {
    clearButton.addEventListener('click', async () => {
      viewState.selectedHistoryFile = '';
      viewState.selectedRecord = null;
      await renderIntoTarget(target);
      writePageDiagnostic('Returned to live-only view.');
    });
  }
}

async function renderIntoTarget(target) {
  const runtimeState = window.voiceCli?.session?.getState?.() ?? {
    runtimeSummary: { status: 'ok', headline: 'Electron runtime ready.' },
    confirmation: null,
    controls: { canStartSession: true, canSendInput: false, currentInputDraft: '' },
    events: [],
    transcript: [],
  };
  const historyResult = await window.voiceCli?.session?.getHistory?.();
  const history = Array.isArray(historyResult) ? historyResult : [];
  target.innerHTML = renderShell(runtimeState, history);
  await bindInteractions(target);
}

async function mount() {
  writePageDiagnostic('DOMContentLoaded fired.');
  const target = document.getElementById('app');
  if (!target) {
    throw new Error('Missing #app mount target.');
  }

  await renderIntoTarget(target);
  writePageDiagnostic('Runtime shell rendered into #app.');

  window.voiceCli?.session?.onEvent?.(async (event) => {
    if (event?.type === 'session.progress') {
      viewState.isStartingSession = false;
      viewState.isSessionRunning = true;
    }
    if (event?.type === 'session.exited') {
      viewState.isStartingSession = false;
      viewState.isSessionRunning = false;
    }
    if (event?.type === 'prompt.detected') {
      viewState.isStartingSession = false;
      viewState.isSessionRunning = true;
    }
    await renderIntoTarget(target);
    writePageDiagnostic('Runtime shell rerendered after event.');
  });

  const testMode = window.voiceCli?.electron?.getTestMode?.() || '';
  if (testMode === 'confirmation') {
    viewState.activePrompt = 'Please approve file changes?';
    viewState.runStartedAt = Date.now();
    await window.voiceCli?.session?.start?.('Please approve file changes?');
    await renderIntoTarget(target);
    writePageDiagnostic('Test mode seeded confirmation flow.');
    setTimeout(async () => {
      await window.voiceCli?.session?.sendInput?.('yes');
      viewState.lastOutcome = 'completed';
      await maybeAutoSelectLatestHistory();
      await renderIntoTarget(target);
      writePageDiagnostic('Test mode auto-approved confirmation flow.');
    }, 150);
  }

  if (testMode === 'real-session') {
    viewState.isStartingSession = true;
    viewState.isSessionRunning = false;
    viewState.activePrompt = 'Say hello briefly.';
    viewState.runStartedAt = Date.now();
    viewState.lastOutcome = 'running';
    startTimingRefresh(target);
    await renderIntoTarget(target);
    await window.voiceCli?.session?.start?.('Say hello briefly.');
    viewState.isStartingSession = false;
    viewState.isSessionRunning = false;
    viewState.lastOutcome = 'completed';
    stopTimingRefresh();
    await maybeAutoSelectLatestHistory();
    await renderIntoTarget(target);
    writePageDiagnostic('Test mode started real IPC-backed session flow.');
  }

  if (window.voiceCli?.electron?.shouldAutoExit?.()) {
    writePageDiagnostic('Auto-exit requested.');
    setTimeout(() => {
      stopTimingRefresh();
      window.close();
    }, testMode === 'confirmation' ? 1200 : 900);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  mount().catch((error) => {
    writePageDiagnostic(`Mount failed: ${error instanceof Error ? error.message : String(error)}`);
  });
});
