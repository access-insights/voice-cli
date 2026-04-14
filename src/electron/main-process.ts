import { createDesktopWindowSpec } from '../app/desktop-shell.ts';

export interface ElectronBootstrapSummary {
  appName: string;
  windowTitle: string;
  startRoute: string;
}

export function bootstrapElectronShell(): ElectronBootstrapSummary {
  const windowSpec = createDesktopWindowSpec();
  return {
    appName: 'voice-cli',
    windowTitle: windowSpec.title,
    startRoute: windowSpec.startRoute,
  };
}
