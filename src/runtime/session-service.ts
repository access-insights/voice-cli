import { CodexCliAdapter } from '../adapters/codex-adapter.ts';
import { summarizeSessionEvents } from '../session/event-normalizer.ts';
import type { SessionEvent } from '../session/event-types.ts';
import { SpawnTransport } from './spawn-transport.ts';
import { NodePtyTransport } from './node-pty-transport.ts';
import type { TerminalTransport } from './transport.ts';

export interface RuntimeSessionStartRequest {
  projectPath: string;
  prompt: string;
  transport?: 'spawn' | 'node-pty';
  onEvent?: (event: SessionEvent) => void;
}

function createTransport(kind: 'spawn' | 'node-pty' = 'spawn'): TerminalTransport {
  if (kind === 'node-pty') {
    return new NodePtyTransport();
  }
  return new SpawnTransport();
}

export async function runManagedSession(request: RuntimeSessionStartRequest) {
  const adapter = new CodexCliAdapter();
  const transportKind = request.transport ?? 'spawn';
  const session = createTransport(transportKind);

  return await new Promise((resolve) => {
    let settled = false;

    const finish = (exitCode: number) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      const events = session.getEvents();
      const summary = summarizeSessionEvents(events);
      resolve({
        adapter: adapter.id,
        transport: transportKind,
        exitCode,
        events,
        spokenSummary: summary.headline,
      });
    };

    const timeout = setTimeout(() => {
      session.stop('Session timed out before completion.');
      finish(-2);
    }, 15000);

    session.onEvent((event) => {
      request.onEvent?.(event);
    });

    session.onExit((exitCode) => {
      finish(exitCode);
    });

    session.start({
      cwd: request.projectPath,
      command: adapter.command,
      args: adapter.argsForPrompt(request.projectPath, request.prompt),
    });
  });
}
