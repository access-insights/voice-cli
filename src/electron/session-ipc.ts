import { createSessionController, type SessionController } from '../runtime/session-controller.ts';
import type { SessionEvent } from '../session/event-types.ts';

export interface SessionIpcApi {
  start(prompt: string): Promise<ReturnType<SessionController['startSession']>>;
  sendInput(input: string): { accepted: boolean; echoedInput: string };
  getHistory(): ReturnType<SessionController['getRuntimeState']>['history'];
  getState(): ReturnType<SessionController['getRuntimeState']>;
  onEvent(listener: (event: SessionEvent) => void): void;
}

export function createSessionIpcApi(projectPath: string, transcriptDir: string): SessionIpcApi {
  const controller = createSessionController({
    projectPath,
    transcriptDir,
    transport: 'node-pty',
  });

  return {
    async start(prompt: string) {
      return controller.startSession({ prompt });
    },

    sendInput(input: string) {
      const approved = /^y(es)?$/i.test(input.trim());
      const echoedInput = controller.respondToConfirmation(approved) ?? input;
      return {
        accepted: Boolean(echoedInput),
        echoedInput,
      };
    },

    getHistory() {
      return controller.getRuntimeState().history;
    },

    getState() {
      return controller.getRuntimeState();
    },

    onEvent(listener: (event: SessionEvent) => void) {
      controller.onEvent(listener);
    },
  };
}
