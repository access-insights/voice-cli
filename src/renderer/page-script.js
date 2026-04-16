import { createSampleRendererState } from './sample-state.ts';
import { renderRendererApp } from './index.ts';

function mount() {
  const target = document.getElementById('app');
  if (!target) {
    throw new Error('Missing #app mount target.');
  }

  const state = createSampleRendererState();
  const runtimeState = window.voiceCli?.session?.getState?.() ?? {
    runtimeSummary: { status: 'ok', headline: 'Electron runtime ready.' },
    confirmation: null,
    controls: { canStartSession: true, canSendInput: false, currentInputDraft: '' },
  };
  const history = window.voiceCli?.session?.getHistory?.() ?? [];

  target.innerHTML = renderRendererApp({
    ...state,
    sessionSummary: runtimeState.runtimeSummary.headline,
  }, {
    runtimeSummary: runtimeState.runtimeSummary,
    history,
    confirmation: runtimeState.confirmation,
    controls: runtimeState.controls,
  });

  const form = document.getElementById('session-start-form');
  const promptInput = document.getElementById('session-start-prompt');
  if (form) {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const prompt = promptInput && 'value' in promptInput && typeof promptInput.value === 'string'
        ? promptInput.value
        : 'Summarize the current project state.';
      await window.voiceCli?.session?.start?.(prompt);
    });
  }

  if (window.voiceCli?.electron?.shouldAutoExit?.()) {
    setTimeout(() => {
      window.close();
    }, 500);
  }
}

window.addEventListener('DOMContentLoaded', mount);
