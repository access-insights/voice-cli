import type { SessionEvent } from '../session/event-types.ts';

export interface RuntimeDiagnostics {
  promptCount: number;
  errorCount: number;
  streamChunkCount: number;
}

export function collectRuntimeDiagnostics(events: SessionEvent[]): RuntimeDiagnostics {
  return {
    promptCount: events.filter((event) => event.type === 'prompt.detected').length,
    errorCount: events.filter((event) => event.type === 'error.detected').length,
    streamChunkCount: events.filter((event) => event.type === 'stream.chunk').length,
  };
}
