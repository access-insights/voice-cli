import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { bootstrapElectronShell } from './electron/main-process.ts';
import { createElectronBootstrapConfig } from './electron/bootstrap-config.ts';
import { createDefaultWindowState } from './electron/window-state.ts';
import { createInitialViewModel } from './app/renderer-model.ts';
import { persistSessionRun } from './persistence/transcript-store.ts';
import { defaultVoicePreferences } from './voice/voice-preferences.ts';
import { eventToSpokenUtterance } from './voice/speech-orchestrator.ts';
import { runManagedSession } from './runtime/session-service.ts';
import { createNodePtyIntegrationPlan } from './runtime/node-pty-plan.ts';
import { getNodePtyReadiness } from './runtime/node-pty-readiness.ts';
import { renderTranscriptShell } from './ui/transcript-shell.ts';
import { renderAppShell } from './ui/app-shell-renderer.ts';
import { defaultSettings } from './settings/settings-store.ts';
import { loadSettings, saveSettings } from './settings/settings-persistence.ts';
import { createFirstRunChecklist } from './onboarding/first-run-flow.ts';
import { renderRendererApp } from './renderer/index.ts';
import { createSampleRendererState } from './renderer/sample-state.ts';
import { createConfirmationRequest } from './safety/confirmation-flow.ts';
import { renderConfirmationPanel } from './ui/confirmation-panel.ts';

async function main() {
  const desktop = bootstrapElectronShell();
  const bootstrap = createElectronBootstrapConfig();
  const windowState = createDefaultWindowState();
  const viewModel = createInitialViewModel();
  const voice = defaultVoicePreferences();
  const projectPath = process.cwd();
  const settingsPath = join(projectPath, '.voice-cli', 'settings.json');
  const initialSettings = defaultSettings();
  saveSettings(settingsPath, initialSettings);
  const settings = loadSettings(settingsPath);
  const onboarding = createFirstRunChecklist(settings);
  const ptyPlan = createNodePtyIntegrationPlan();
  const ptyReadiness = getNodePtyReadiness();
  const prompt = 'Summarize the current repository structure in one short paragraph.';
  const result = await runManagedSession({ projectPath, prompt, transport: 'spawn' });
  const transcriptDir = join(projectPath, '.voice-cli', 'sessions');
  mkdirSync(transcriptDir, { recursive: true });
  const savedPath = persistSessionRun(transcriptDir, result);
  const spokenUtterances = result.events
    .map((event) => eventToSpokenUtterance(event, voice))
    .filter(Boolean);

  const transcriptLines = [
    ...viewModel.transcript,
    ...spokenUtterances.map((utterance) => ({
      role: 'assistant' as const,
      mode: utterance.kind === 'status' ? 'status' as const : 'summary' as const,
      text: utterance.text,
    })),
  ];

  const transcriptHtml = renderTranscriptShell(transcriptLines);
  const transcriptHtmlPath = join(projectPath, '.voice-cli', 'transcript-preview.html');
  writeFileSync(transcriptHtmlPath, transcriptHtml);

  const appShellHtml = renderAppShell({
    transcript: transcriptLines,
    settings,
    onboarding,
    session: {
      adapter: viewModel.selectedAdapter,
      exitCode: result.exitCode,
      spokenSummary: result.spokenSummary,
    },
  });
  const appShellHtmlPath = join(projectPath, '.voice-cli', 'app-preview.html');
  writeFileSync(appShellHtmlPath, appShellHtml);

  const rendererPreviewHtml = renderRendererApp(createSampleRendererState());
  const rendererPreviewPath = join(projectPath, '.voice-cli', 'renderer-preview.html');
  writeFileSync(rendererPreviewPath, rendererPreviewHtml);

  const confirmation = createConfirmationRequest(
    'Apply file changes',
    'The CLI wants to modify project files.',
    'high'
  );
  const confirmationPreviewPath = join(projectPath, '.voice-cli', 'confirmation-preview.html');
  writeFileSync(confirmationPreviewPath, renderConfirmationPanel(confirmation));

  console.log(JSON.stringify({
    desktop,
    bootstrap,
    windowState,
    settings,
    settingsPath,
    onboarding,
    confirmation,
    selectedAdapter: viewModel.selectedAdapter,
    exitCode: result.exitCode,
    spokenSummary: result.spokenSummary,
    spokenUtterances,
    transcriptPath: savedPath,
    transcriptHtmlPath,
    appShellHtmlPath,
    rendererPreviewPath,
    confirmationPreviewPath,
    ptyPlan,
    ptyReadiness,
    transport: result.transport,
    eventTypes: result.events.map((event) => event.type),
  }, null, 2));
}

main();
