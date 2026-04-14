import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { bootstrapElectronShell } from './electron/main-process.ts';
import { createElectronBootstrapConfig } from './electron/bootstrap-config.ts';
import { createDefaultWindowState } from './electron/window-state.ts';
import { createInitialViewModel, type TranscriptLine } from './app/renderer-model.ts';
import { persistSessionRun } from './persistence/transcript-store.ts';
import { loadSessionHistory } from './persistence/session-history.ts';
import { defaultVoicePreferences } from './voice/voice-preferences.ts';
import { eventToSpokenUtterance } from './voice/speech-orchestrator.ts';
import { createNodePtyIntegrationPlan } from './runtime/node-pty-plan.ts';
import { getNodePtyReadiness } from './runtime/node-pty-readiness.ts';
import { renderTranscriptShell } from './ui/transcript-shell.ts';
import { renderAppShell } from './ui/app-shell-renderer.ts';
import { defaultSettings } from './settings/settings-store.ts';
import { loadSettings, saveSettings } from './settings/settings-persistence.ts';
import { createFirstRunChecklist } from './onboarding/first-run-flow.ts';
import { createSessionController } from './runtime/session-controller.ts';

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
  const transcriptDir = join(projectPath, '.voice-cli', 'sessions');
  mkdirSync(transcriptDir, { recursive: true });

  const controller = createSessionController({
    projectPath,
    transcriptDir,
    transport: 'node-pty',
  });

  const transcriptLines: TranscriptLine[] = [...viewModel.transcript];
  const eventTypes: string[] = [];

  controller.onEvent((event) => {
    eventTypes.push(event.type);
    const utterance = eventToSpokenUtterance(event, voice);
    if (!utterance) return;

    transcriptLines.push({
      role: 'assistant',
      mode: utterance.kind === 'status' ? 'status' : 'summary',
      text: utterance.text,
    });
  });

  const result = await controller.startSession({
    prompt: 'Summarize the current repository structure in one short paragraph.',
  });
  const savedPath = persistSessionRun(transcriptDir, result);

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
    runtimeSummary: controller.getRuntimeState().runtimeSummary,
    detail: null,
    history: loadSessionHistory(projectPath),
    confirmation: controller.getRuntimeState().confirmation,
    controls: controller.getRuntimeState().controls,
  });
  const appShellHtmlPath = join(projectPath, '.voice-cli', 'app-preview.html');
  writeFileSync(appShellHtmlPath, appShellHtml);

  console.log(JSON.stringify({
    desktop,
    bootstrap,
    windowState,
    settings,
    settingsPath,
    onboarding,
    selectedAdapter: viewModel.selectedAdapter,
    exitCode: result.exitCode,
    spokenSummary: result.spokenSummary,
    transcriptPath: savedPath,
    transcriptHtmlPath,
    appShellHtmlPath,
    ptyPlan,
    ptyReadiness,
    transport: result.transport,
    eventTypes,
    runtimeState: controller.getRuntimeState(),
  }, null, 2));
}

main();
