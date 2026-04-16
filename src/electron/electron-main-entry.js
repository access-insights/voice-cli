import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

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
    return {
      launched: false,
      reason: 'Electron runtime not available.',
      spec,
    };
  }

  await electronRuntime.app.whenReady();
  const browserWindow = new electronRuntime.BrowserWindow({
    width: spec.window.width,
    height: spec.window.height,
    title: spec.window.title,
    webPreferences: {
      preload: spec.preloadPath,
    },
  });
  await browserWindow.loadURL(spec.rendererUrl);

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
    console.error(error);
    process.exitCode = 1;
  });
}
