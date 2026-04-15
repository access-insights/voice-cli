import { createIpcContract } from './ipc-contract.ts';
import { createElectronMainHandlers, type ElectronMainHandlers } from './main-handlers.ts';

export interface HandlerRegistry {
  [channel: string]: (...args: unknown[]) => unknown;
}

export function createHandlerRegistry(projectPath = process.cwd()): HandlerRegistry {
  const contract = createIpcContract();
  const handlers: ElectronMainHandlers = createElectronMainHandlers(projectPath);

  return {
    [contract.session.start]: (prompt: string) => handlers.session.start(prompt),
    [contract.session.sendInput]: (input: string) => handlers.session.sendInput(input),
    [contract.session.getHistory]: () => handlers.session.getHistory(),
    'session:get-state': () => handlers.session.getState(),
    'electron:get-shell-summary': () => handlers.electron.getShellSummary(),
    'electron:get-config': () => handlers.electron.getConfig(),
  };
}
