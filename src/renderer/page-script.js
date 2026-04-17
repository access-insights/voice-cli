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

function renderStatusBadge(runtimeSummary) {
  const status = runtimeSummary?.status || 'ok';
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
              ? 'Lifecycle'
              : entry.source === 'stderr'
                ? 'stderr'
                : 'stdout';

        return `
          <li>
            <strong>${escapeHtml(label)}</strong>
            <p>${escapeHtml(entry.summary)}</p>
            ${entry.raw ? `<details><summary>Raw output</summary><pre>${escapeHtml(entry.raw)}</pre></details>` : ''}
          </li>
        `;
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

  return `
    <section aria-labelledby="runtime-heading">
      <h2 id="runtime-heading">Runtime status</h2>
      ${renderStatusBadge(runtimeState.runtimeSummary)}
      <p>${escapeHtml(runtimeState.runtimeSummary.headline)}</p>
    </section>
    <section aria-labelledby="controls-heading">
      <h2 id="controls-heading">Session controls</h2>
      <form id="session-start-form">
        <label for="session-start-prompt">Start prompt</label>
        <input id="session-start-prompt" name="prompt" type="text" value="Summarize the current project state." />
        <button id="session-start-button" type="submit">Start session</button>
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

async function bindInteractions(target) {
  const form = document.getElementById('session-start-form');
  const promptInput = document.getElementById('session-start-prompt');
  if (form) {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const prompt = promptInput && 'value' in promptInput && typeof promptInput.value === 'string'
        ? promptInput.value
        : 'Summarize the current project state.';
      writePageDiagnostic(`Submitting prompt: ${prompt}`);
      await window.voiceCli?.session?.start?.(prompt);
      await renderIntoTarget(target);
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
    await window.voiceCli?.session?.start?.('Say hello briefly.');
    await renderIntoTarget(target);
    writePageDiagnostic('Test mode started real IPC-backed session flow.');
  }

  if (window.voiceCli?.electron?.shouldAutoExit?.()) {
    writePageDiagnostic('Auto-exit requested.');
    setTimeout(() => {
      window.close();
    }, testMode === 'confirmation' ? 1200 : 900);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  mount().catch((error) => {
    writePageDiagnostic(`Mount failed: ${error instanceof Error ? error.message : String(error)}`);
  });
});
