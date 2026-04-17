function writePageDiagnostic(message) {
  try {
    console.log(`[voice-cli page] ${message}`);
  } catch {
    // no-op
  }
}

function renderEvents(events) {
  if (!events.length) {
    return '<p>No session events captured yet.</p>';
  }

  return `
    <ol>
      ${events.map((event) => `<li><strong>${event.type}</strong> | ${event.summary}${event.raw ? `<details><summary>Raw output</summary><pre>${event.raw}</pre></details>` : ''}</li>`).join('')}
    </ol>
  `;
}

function renderShell(runtimeState, history) {
  const confirmationSection = runtimeState.confirmation ? `
    <section aria-labelledby="confirmation-heading">
      <h2 id="confirmation-heading">Confirmation required</h2>
      <p><strong>Action:</strong> ${runtimeState.confirmation.actionLabel}</p>
      <p><strong>Reason:</strong> ${runtimeState.confirmation.reason}</p>
      <form id="session-input-form">
        <label for="session-input-response">Response</label>
        <input id="session-input-response" name="response" type="text" value="${runtimeState.controls.currentInputDraft || 'yes'}" />
        <button id="session-input-button" type="submit">Send response</button>
      </form>
    </section>
  ` : '';

  return `
    <section aria-labelledby="runtime-heading">
      <h2 id="runtime-heading">Runtime status</h2>
      <p>${runtimeState.runtimeSummary.headline}</p>
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
    <section aria-labelledby="events-heading">
      <h2 id="events-heading">Session events</h2>
      ${renderEvents(Array.isArray(runtimeState.events) ? runtimeState.events : [])}
    </section>
    <section aria-labelledby="history-heading">
      <h2 id="history-heading">Session history</h2>
      <p>${history.length} recorded sessions.</p>
      <ul>${history.map((item) => `<li>${item.fileName} | ${item.adapter} | exit ${item.exitCode} | ${item.spokenSummary}</li>`).join('')}</ul>
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
