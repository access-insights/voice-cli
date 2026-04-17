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
  activePrompt: '',
  runStartedAt: 0,
  timingIntervalId: null,
  lastOutcome: 'idle',
};

function getElapsedLabel() {
  if (!viewState.runStartedAt) return 'Not running';
  const elapsedMs = Math.max(0, Date.now() - viewState.runStartedAt);
  return `${(elapsedMs / 1000).toFixed(1)}s`;
}

function renderBanner(runtimeSummary) {
  if (viewState.isStartingSession) {
    return '<p><strong>Starting session...</strong> The shell is waiting for the CLI run to return.</p>';
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
  const status = viewState.isStartingSession
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

function toTranscriptEntries(events) {
  const entries = [];

  for (const event of events) {
    if (event.type === 'stream.chunk') {
      const last = entries.at(-1);
      if (last && last.kind === 'stream' && last.source === event.source) {
        last.summary = `${last.summary}\n${event.summary || ''}`.trim();
        last.raw = `${last.raw || ''}\n${event.raw || ''}`.trim();
      } else {
        entries.push({
          kind: 'stream',
          source: event.source || 'stdout',
          summary: event.summary || 'No summary',
          raw: event.raw || '',
        });
      }
      continue;
    }

    if (event.type === 'prompt.detected' || event.type === 'error.detected') {
      entries.push({
        kind: event.type === 'prompt.detected' ? 'prompt' : 'error',
        source: event.source || 'system',
        summary: event.summary || 'No summary',
        raw: event.raw || '',
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
              : entry.source === 'stderr'
                ? 'CLI stderr'
                : 'CLI stdout';

        const content = `
          <strong>${escapeHtml(label)}</strong>
          <p>${escapeHtml(entry.summary)}</p>
          ${entry.raw ? `<details><summary>Raw output</summary><pre>${escapeHtml(entry.raw)}</pre></details>` : ''}
        `;

        if (entry.kind === 'lifecycle') {
          return `<li><details><summary>${escapeHtml(label)} event</summary>${content}</details></li>`;
        }

        return `<li>${content}</li>`;
      }).join('')}
    </ol>
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

  const transcriptEntries = toTranscriptEntries(Array.isArray(runtimeState.events) ? runtimeState.events : []);
  const startButtonLabel = viewState.isStartingSession ? 'Starting…' : 'Start session';
  const startDisabled = viewState.isStartingSession ? 'disabled' : '';

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
      <h2 id="transcript-heading">Transcript</h2>
      ${renderTranscript(transcriptEntries)}
    </section>
    <section aria-labelledby="history-heading">
      <h2 id="history-heading">Session history</h2>
      <p>${history.length} recorded sessions.</p>
      <ul>${history.map((item) => `<li>${escapeHtml(item.fileName)} | ${escapeHtml(item.adapter)} | exit ${escapeHtml(item.exitCode)} | ${escapeHtml(item.spokenSummary)}</li>`).join('')}</ul>
    </section>
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
    if (!viewState.isStartingSession) {
      stopTimingRefresh();
      return;
    }
    renderIntoTarget(target).catch(() => {});
  }, 250);
}

async function bindInteractions(target) {
  const form = document.getElementById('session-start-form');
  const promptInput = document.getElementById('session-start-prompt');
  if (form) {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (viewState.isStartingSession) return;
      const prompt = promptInput && 'value' in promptInput && typeof promptInput.value === 'string'
        ? promptInput.value
        : 'Summarize the current project state.';
      viewState.isStartingSession = true;
      viewState.activePrompt = prompt;
      viewState.runStartedAt = Date.now();
      viewState.lastOutcome = 'running';
      startTimingRefresh(target);
      await renderIntoTarget(target);
      writePageDiagnostic(`Submitting prompt: ${prompt}`);
      try {
        await window.voiceCli?.session?.start?.(prompt);
        viewState.lastOutcome = 'completed';
      } catch (error) {
        viewState.lastOutcome = 'error';
        throw error;
      } finally {
        viewState.isStartingSession = false;
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
      await renderIntoTarget(target);
      writePageDiagnostic('Runtime shell rerendered after input response.');
    });
  }
}

async function renderIntoTarget(target) {
  const runtimeState = window.voiceCli?.session?.getState?.() ?? {
    runtimeSummary: { status: 'ok', headline: 'Electron runtime ready.' },
    confirmation: null,
    controls: { canStartSession: true, canSendInput: false, currentInputDraft: '' },
    events: [],
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

  window.voiceCli?.session?.onEvent?.(async () => {
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
      await renderIntoTarget(target);
      writePageDiagnostic('Test mode auto-approved confirmation flow.');
    }, 150);
  }

  if (testMode === 'real-session') {
    viewState.isStartingSession = true;
    viewState.activePrompt = 'Say hello briefly.';
    viewState.runStartedAt = Date.now();
    viewState.lastOutcome = 'running';
    startTimingRefresh(target);
    await renderIntoTarget(target);
    await window.voiceCli?.session?.start?.('Say hello briefly.');
    viewState.isStartingSession = false;
    viewState.lastOutcome = 'completed';
    stopTimingRefresh();
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
