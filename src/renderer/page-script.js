function writePageDiagnostic(message) {
  try {
    console.log(`[voice-cli page] ${message}`);
  } catch {
    // no-op
  }
}

function renderFallbackShell(runtimeState, history) {
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
    <section aria-labelledby="history-heading">
      <h2 id="history-heading">Session history</h2>
      <p>${history.length} recorded sessions.</p>
    </section>
  `;
}

function mount() {
  writePageDiagnostic('DOMContentLoaded fired.');
  const target = document.getElementById('app');
  if (!target) {
    throw new Error('Missing #app mount target.');
  }

  const runtimeState = window.voiceCli?.session?.getState?.() ?? {
    runtimeSummary: { status: 'ok', headline: 'Electron runtime ready.' },
    confirmation: null,
    controls: { canStartSession: true, canSendInput: false, currentInputDraft: '' },
  };
  const history = window.voiceCli?.session?.getHistory?.() ?? [];

  target.innerHTML = renderFallbackShell(runtimeState, history);
  writePageDiagnostic('Fallback shell rendered into #app.');

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
    });
  }

  if (window.voiceCli?.electron?.shouldAutoExit?.()) {
    writePageDiagnostic('Auto-exit requested.');
    setTimeout(() => {
      window.close();
    }, 500);
  }
}

window.addEventListener('DOMContentLoaded', mount);
