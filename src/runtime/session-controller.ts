import type { SessionEvent } from '../session/event-types.ts';
import { summarizeRuntimeHealth, type RuntimeHealthSummary } from './runtime-summary.ts';
import { detectConfirmationRequest } from '../session/confirmation-detector.ts';
import type { ConfirmationRequest } from '../safety/confirmation-flow.ts';
import { buildPromptResponse } from './prompt-response.ts';
import { loadSessionHistory, type StoredSessionSummary } from '../persistence/session-history.ts';
import { runManagedSession, type RuntimeSessionStartRequest } from './session-service.ts';
import { createDefaultSessionControls, type SessionControlState } from '../renderer/session-controls.ts';

export interface SessionControllerState {
  runtimeSummary: RuntimeHealthSummary;
  confirmation: ConfirmationRequest | null;
  history: StoredSessionSummary[];
  controls: SessionControlState;
}

export interface SessionControllerOptions {
  projectPath: string;
  transcriptDir: string;
  transport?: 'spawn' | 'node-pty';
}

export interface SessionStartRequest {
  prompt: string;
}

export interface SessionControllerResult {
  adapter: string;
  transport: 'spawn' | 'node-pty';
  exitCode: number;
  events: SessionEvent[];
  spokenSummary: string;
}

export interface SessionController {
  startSession(request: SessionStartRequest): Promise<SessionControllerResult>;
  respondToConfirmation(approved: boolean): string | null;
  getRuntimeState(): SessionControllerState;
  onEvent(listener: (event: SessionEvent) => void): void;
}

export function createSessionController(options: SessionControllerOptions): SessionController {
  let events: SessionEvent[] = [];
  let listeners: Array<(event: SessionEvent) => void> = [];
  let confirmation: ConfirmationRequest | null = null;
  let controls = createDefaultSessionControls();
  let runtimeSummary = summarizeRuntimeHealth([]);

  function emit(event: SessionEvent): void {
    events.push(event);
    runtimeSummary = summarizeRuntimeHealth(events);
    confirmation = detectConfirmationRequest(events);
    controls = {
      canStartSession: false,
      canSendInput: confirmation !== null,
      currentInputDraft: confirmation ? 'yes' : '',
    };
    for (const listener of listeners) listener(event);
  }

  return {
    async startSession(request: SessionStartRequest): Promise<SessionControllerResult> {
      events = [];
      confirmation = null;
      controls = {
        canStartSession: false,
        canSendInput: false,
        currentInputDraft: '',
      };

      const result = await runManagedSession({
        projectPath: options.projectPath,
        prompt: request.prompt,
        transport: options.transport ?? 'node-pty',
        onEvent: emit,
      } as RuntimeSessionStartRequest & { onEvent: (event: SessionEvent) => void });

      runtimeSummary = summarizeRuntimeHealth(result.events);
      confirmation = detectConfirmationRequest(result.events);
      controls = {
        canStartSession: true,
        canSendInput: confirmation !== null,
        currentInputDraft: confirmation ? 'yes' : '',
      };

      return result;
    },

    respondToConfirmation(approved: boolean): string | null {
      if (!confirmation) return null;
      const response = buildPromptResponse(confirmation, approved);
      controls = {
        canStartSession: true,
        canSendInput: false,
        currentInputDraft: response.responseText.trim(),
      };
      return response.responseText;
    },

    getRuntimeState(): SessionControllerState {
      return {
        runtimeSummary,
        confirmation,
        history: loadSessionHistory(options.projectPath),
        controls,
      };
    },

    onEvent(listener: (event: SessionEvent) => void): void {
      listeners.push(listener);
    },
  };
}
