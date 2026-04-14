import type { AppSettings } from '../settings/settings-store.ts';

export function renderSettingsPanel(settings: AppSettings): string {
  return `
    <section aria-labelledby="settings-heading">
      <h2 id="settings-heading">Settings</h2>
      <ul>
        <li>Preferred CLI: ${escapeHtml(settings.preferredCli)}</li>
        <li>Preferred voice: ${escapeHtml(settings.preferredVoice)}</li>
        <li>Speech rate: ${settings.speechRate}</li>
        <li>Transcript mode: ${escapeHtml(settings.transcriptMode)}</li>
        <li>Risk confirmation required: ${settings.requireRiskConfirmation ? 'yes' : 'no'}</li>
      </ul>
    </section>
  `;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}
