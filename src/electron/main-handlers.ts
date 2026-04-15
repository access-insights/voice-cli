import { createElectronMainBootstrap, type ElectronMainBootstrap } from './main-bootstrap.ts';

export interface ElectronMainHandlers {
  session: {
    start(prompt: string): ReturnType<ElectronMainBootstrap['sessionApi']['start']>;
    sendInput(input: string): ReturnType<ElectronMainBootstrap['sessionApi']['sendInput']>;
    getHistory(): ReturnType<ElectronMainBootstrap['sessionApi']['getHistory']>;
    getState(): ReturnType<ElectronMainBootstrap['sessionApi']['getState']>;
    onEvent(listener: Parameters<ElectronMainBootstrap['sessionApi']['onEvent']>[0]): void;
  };
  electron: {
    getShellSummary(): ElectronMainBootstrap['shell'];
    getConfig(): ElectronMainBootstrap['config'];
  };
}

export function createElectronMainHandlers(projectPath = process.cwd()): ElectronMainHandlers {
  const bootstrap = createElectronMainBootstrap(projectPath);

  return {
    session: {
      start: (prompt: string) => bootstrap.sessionApi.start(prompt),
      sendInput: (input: string) => bootstrap.sessionApi.sendInput(input),
      getHistory: () => bootstrap.sessionApi.getHistory(),
      getState: () => bootstrap.sessionApi.getState(),
      onEvent: (listener) => bootstrap.sessionApi.onEvent(listener),
    },
    electron: {
      getShellSummary: () => bootstrap.shell,
      getConfig: () => bootstrap.config,
    },
  };
}
