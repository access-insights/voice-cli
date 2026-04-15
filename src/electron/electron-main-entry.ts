import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createElectronBootstrapConfig } from './bootstrap-config.ts';
import { createDesktopWindowSpec } from '../app/desktop-shell.ts';

export interface RealElectronLaunchSpec {
  window: ReturnType<typeof createDesktopWindowSpec>;
  preloadPath: string;
  rendererUrl: string;
}

export function createRealElectronLaunchSpec(projectPath = process.cwd()): RealElectronLaunchSpec {
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

export async function launchElectronApp(electronRuntime?: {
  app?: { whenReady(): Promise<void> };
  BrowserWindow?: new (options: Record<string, unknown>) => { loadURL(url: string): Promise<void> | void };
}) {
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
