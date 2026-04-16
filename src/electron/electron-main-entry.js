import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { appendFileSync, mkdirSync } from 'node:fs';

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
    browserWindow.webContents.on('did-finish-load', () => {
      writeDiagnostic('Renderer finished load.');
    });
    browserWindow.webContents.on('did-fail-load', (_event, code, description) => {
      writeDiagnostic(`Renderer failed load: ${code} ${description}`);
    });
    browserWindow.webContents.on('console-message', (_event, level, message) => {
      writeDiagnostic(`Renderer console[${level}]: ${message}`);
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
  launchElectronApp({
    app: electronModule.app,
    BrowserWindow: electronModule.BrowserWindow,
  }).catch((error) => {
    writeDiagnostic(`Launch error: ${error instanceof Error ? error.stack ?? error.message : String(error)}`);
    console.error(error);
    process.exitCode = 1;
  });
}
