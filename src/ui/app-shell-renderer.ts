import type { TranscriptLine } from '../app/renderer-model.ts';
import type { AppSettings } from '../settings/settings-store.ts';
import type { FirstRunChecklistItem } from '../onboarding/first-run-flow.ts';
import { renderTranscriptShell } from './transcript-shell.ts';
import { renderSettingsPanel } from './settings-panel.ts';
import { renderOnboardingPanel } from './onboarding-panel.ts';
import { renderSessionStatusPanel, type SessionStatusView } from './session-status-panel.ts';
import { renderRuntimeStatusBanner } from './runtime-status-banner.ts';
import type { RuntimeHealthSummary } from '../runtime/runtime-summary.ts';
import { renderDetailPanel } from './detail-panel.ts';
import type { DetailRequestResult } from '../session/detail-requests.ts';
import { renderHistoryPanel } from './history-panel.ts';
import type { StoredSessionSummary } from '../persistence/session-history.ts';
import { renderConfirmationPanel } from './confirmation-panel.ts';
import type { ConfirmationRequest } from '../safety/confirmation-flow.ts';
import type { SessionControlState } from '../renderer/session-controls.ts';

export function renderAppShell(params: {
  transcript: TranscriptLine[];
  settings: AppSettings;
  onboarding: FirstRunChecklistItem[];
  session: SessionStatusView;
  runtimeSummary?: RuntimeHealthSummary;
  detail?: DetailRequestResult | null;
  history?: StoredSessionSummary[];
  confirmation?: ConfirmationRequest | null;
  controls?: SessionControlState;
}): string {
  const transcriptHtml = renderTranscriptShell(params.transcript)
    .replace('<!doctype html>', '')
    .replace(/<html[^>]*>/, '')
    .replace('</html>', '')
    .replace(/<head>[\s\S]*?<\/head>/, '')
    .replace('<body>', '')
    .replace('</body>', '');

  const runtimeBanner = params.runtimeSummary ? renderRuntimeStatusBanner(params.runtimeSummary) : '';
  const detailPanel = renderDetailPanel(params.detail ?? null);
  const historyPanel = renderHistoryPanel(params.history ?? []);
  const confirmationPanel = params.confirmation ? renderConfirmationPanel(params.confirmation) : '';
  const controlsPanel = params.controls ? `
    <section aria-labelledby="controls-heading">
      <h2 id="controls-heading">Session controls</h2>
      <p>Start available: ${params.controls.canStartSession ? 'yes' : 'no'}</p>
      <p>Input available: ${params.controls.canSendInput ? 'yes' : 'no'}</p>
      <p>Draft response: ${params.controls.currentInputDraft || '(empty)'}</p>
      <form id="session-start-form">
        <label for="session-start-prompt">Start prompt</label>
        <input id="session-start-prompt" name="prompt" type="text" value="Summarize the current project state." />
        <button id="session-start-button" type="submit">Start session</button>
      </form>
    </section>
  ` : '';

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>voice-cli app preview</title>
  </head>
  <body>
    <main>
      <h1>voice-cli app preview</h1>
      ${runtimeBanner}
      ${renderOnboardingPanel(params.onboarding)}
      ${renderSettingsPanel(params.settings)}
      ${renderSessionStatusPanel(params.session)}
      ${controlsPanel}
      ${confirmationPanel}
      ${historyPanel}
      ${detailPanel}
      ${transcriptHtml}
    </main>
  </body>
</html>`;
}
