import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { appendFileSync, mkdirSync } from 'node:fs';
import { loadSessionRecord, loadSessionSummaries, persistSessionRecord, persistSessionSummary } from './main-session-storage.js';
import { respondToCodexPromptInMain, runCodexVerticalSliceInMain } from './main-session-runner.js';
import { speakTextInMain } from './main-voice.js';
import { loadTranscriptionTextInMain, transcribeAudioInMain } from './main-transcription.js';
import { persistCapturedAudioInMain } from './main-audio-capture.js';

function createDesktopWindowSpec() {
  return {
    title: 'voice-cli',
    width: 1280,
    height: 900,
    startRoute: '/',
  };
}

function createElectronBootstrapConfig() {
  return {
    appId: 'ai.access-insights.voice-cli',
    windowTitle: 'voice-cli',
    rendererEntryHtml: 'website/app-shell.html',
    preloadEntry: 'src/electron/preload.js',
  };
}

function getDiagnosticsPath(projectPath = process.cwd()) {
  const dir = join(projectPath, '.voice-cli');
  mkdirSync(dir, { recursive: true });
  return join(dir, 'electron-runtime.log');
}

function writeDiagnostic(message, projectPath = process.cwd()) {
  appendFileSync(getDiagnosticsPath(projectPath), `${new Date().toISOString()} ${message}\n`);
}

export function createRealElectronLaunchSpec(projectPath = process.cwd()) {
  const config = createElectronBootstrapConfig();
  const window = createDesktopWindowSpec();
  const preloadPath = join(projectPath, config.preloadEntry);
  const rendererUrl = pathToFileURL(join(projectPath, config.rendererEntryHtml)).toString();

  return {
    window,
    preloadPath,
    rendererUrl,
  };
}

export async function launchElectronApp(electronRuntime) {
  const spec = createRealElectronLaunchSpec();

  if (!electronRuntime?.app || !electronRuntime?.BrowserWindow) {
    writeDiagnostic('Electron runtime not available.');
    return {
      launched: false,
      reason: 'Electron runtime not available.',
      spec,
    };
  }

  await electronRuntime.app.whenReady();
  writeDiagnostic('Electron app ready.');

  const browserWindow = new electronRuntime.BrowserWindow({
    width: spec.window.width,
    height: spec.window.height,
    title: spec.window.title,
    webPreferences: {
      preload: spec.preloadPath,
    },
  });
  writeDiagnostic(`BrowserWindow created with preload ${spec.preloadPath}`);

  if (typeof browserWindow.webContents?.on === 'function') {
    browserWindow.webContents.on('did-finish-load', async () => {
      writeDiagnostic('Renderer finished load.');
      if (process.env.VOICE_CLI_TEST_MODE === 'confirmation-persist') {
        const persisted = persistSessionSummary(process.cwd(), {
          adapter: 'codex',
          exitCode: 0,
          spokenSummary: 'Main-side persisted confirmation smoke entry.',
        });
        writeDiagnostic(`Main-side persisted session summary at ${persisted}`);
      }
      if (process.env.VOICE_CLI_AUTO_EXIT === '1') {
        writeDiagnostic('Main process auto-exit requested after did-finish-load.');
        const autoExitDelayMs = Number.parseInt(process.env.VOICE_CLI_AUTO_EXIT_DELAY_MS || '500', 10);
        setTimeout(() => {
          browserWindow.close();
          if (typeof electronRuntime.app?.quit === 'function') {
            electronRuntime.app.quit();
          }
        }, Number.isFinite(autoExitDelayMs) ? autoExitDelayMs : 500);
      }
    });
    browserWindow.webContents.on('did-fail-load', (_event, code, description) => {
      writeDiagnostic(`Renderer failed load: ${code} ${description}`);
    });
    browserWindow.webContents.on('console-message', (eventOrLevel, levelOrMessage, maybeMessage) => {
      if (typeof eventOrLevel === 'object' && eventOrLevel !== null && 'message' in eventOrLevel) {
        writeDiagnostic(`Renderer console[${eventOrLevel.level}]: ${eventOrLevel.message}`);
        return;
      }
      writeDiagnostic(`Renderer console[${levelOrMessage}]: ${maybeMessage}`);
    });
  }

  await browserWindow.loadURL(spec.rendererUrl);
  writeDiagnostic(`Renderer loadURL called for ${spec.rendererUrl}`);

  return {
    launched: true,
    spec,
  };
}

if (process.versions.electron) {
  const electronModule = await import('electron');
  electronModule.ipcMain.handle('voice-cli:load-history', () => loadSessionSummaries(process.cwd()));
  electronModule.ipcMain.handle('voice-cli:persist-history', (_event, entry) => {
    const filePath = persistSessionSummary(process.cwd(), entry);
    writeDiagnostic(`IPC persisted session summary at ${filePath}`);
    return { filePath };
  });
  electronModule.ipcMain.handle('voice-cli:start-session', (event, prompt) => {
    const result = runCodexVerticalSliceInMain({
      projectPath: process.cwd(),
      prompt,
      onEvent: (sessionEvent) => {
        event.sender.send('voice-cli:session-event', { event: sessionEvent });
      },
    });
    const filePath = persistSessionRecord(process.cwd(), result);
    writeDiagnostic(`IPC started real session and persisted record at ${filePath}`);
    return result;
  });
  electronModule.ipcMain.handle('voice-cli:respond-session', (event, input) => {
    const approved = /^y(es)?$/i.test(String(input).trim());
    const result = respondToCodexPromptInMain({
      approved,
      onEvent: (sessionEvent) => {
        event.sender.send('voice-cli:session-event', { event: sessionEvent });
      },
    });
    const filePath = persistSessionRecord(process.cwd(), result);
    writeDiagnostic(`IPC responded to session prompt and persisted record at ${filePath}`);
    return result;
  });
  electronModule.ipcMain.handle('voice-cli:load-session-record', (_event, fileName) => loadSessionRecord(process.cwd(), fileName));
  electronModule.ipcMain.handle('voice-cli:speak-text', (_event, payload) => {
    const result = speakTextInMain(payload?.text, { rate: payload?.rate });
    writeDiagnostic(`IPC speak-text result: ${JSON.stringify({ ok: result.ok, backend: result.backend ?? null, reason: result.reason ?? null })}`);
    return result;
  });
  electronModule.ipcMain.handle('voice-cli:transcribe-audio', (_event, payload) => {
    const result = transcribeAudioInMain(payload?.audioPath, {
      model: payload?.model,
      language: payload?.language,
      prompt: payload?.prompt,
      outPath: payload?.outPath,
    });
    writeDiagnostic(`IPC transcribe-audio result: ${JSON.stringify({ ok: result.ok, provider: result.provider ?? null, reason: result.reason ?? null })}`);
    return result;
  });
  electronModule.ipcMain.handle('voice-cli:load-transcription-text', (_event, payload) => {
    const result = loadTranscriptionTextInMain(payload?.filePath);
    writeDiagnostic(`IPC load-transcription-text result: ${JSON.stringify({ ok: result.ok, filePath: result.filePath ?? null, reason: result.reason ?? null })}`);
    return result;
  });
  electronModule.ipcMain.handle('voice-cli:persist-captured-audio', (_event, payload) => {
    const result = persistCapturedAudioInMain(payload?.bufferBase64, {
      extension: payload?.extension,
      mimeType: payload?.mimeType,
    });
    writeDiagnostic(`IPC persist-captured-audio result: ${JSON.stringify({ ok: result.ok, filePath: result.filePath ?? null, reason: result.reason ?? null })}`);
    return result;
  });
  launchElectronApp({
    app: electronModule.app,
    BrowserWindow: electronModule.BrowserWindow,
  }).catch((error) => {
    writeDiagnostic(`Launch error: ${error instanceof Error ? error.stack ?? error.message : String(error)}`);
    console.error(error);
    process.exitCode = 1;
  });
}
