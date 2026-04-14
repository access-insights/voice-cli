export interface ElectronBootstrapConfig {
  appId: string;
  windowTitle: string;
  rendererEntryHtml: string;
  preloadEntry: string;
}

export function createElectronBootstrapConfig(): ElectronBootstrapConfig {
  return {
    appId: 'ai.access-insights.voice-cli',
    windowTitle: 'voice-cli',
    rendererEntryHtml: 'website/app-shell.html',
    preloadEntry: 'src/electron/preload.ts',
  };
}
