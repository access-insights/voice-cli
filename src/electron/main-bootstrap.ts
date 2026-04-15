import { join } from 'node:path';
import { createSessionIpcApi, type SessionIpcApi } from './session-ipc.ts';
import { createElectronBootstrapConfig } from './bootstrap-config.ts';
import { bootstrapElectronShell } from './main-process.ts';

export interface ElectronMainBootstrap {
  shell: ReturnType<typeof bootstrapElectronShell>;
  config: ReturnType<typeof createElectronBootstrapConfig>;
  sessionApi: SessionIpcApi;
}

export function createElectronMainBootstrap(projectPath = process.cwd()): ElectronMainBootstrap {
  const transcriptDir = join(projectPath, '.voice-cli', 'sessions');

  return {
    shell: bootstrapElectronShell(),
    config: createElectronBootstrapConfig(),
    sessionApi: createSessionIpcApi(projectPath, transcriptDir),
  };
}
