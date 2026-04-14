import { spawnSync } from 'node:child_process';
import { CodexCliAdapter } from '../adapters/codex-adapter.ts';
import { createStreamEvent, summarizeSessionEvents } from './event-normalizer.ts';
import type { SessionEvent } from './event-types.ts';

export interface SessionRunRequest {
  projectPath: string;
  prompt: string;
}

export interface SessionRunResult {
  adapter: string;
  exitCode: number;
  events: SessionEvent[];
  spokenSummary: string;
}

export function runCodexVerticalSlice(request: SessionRunRequest): SessionRunResult {
  const adapter = new CodexCliAdapter();
  const args = adapter.argsForPrompt(request.projectPath, request.prompt);
  const result = spawnSync(adapter.command, args, {
    cwd: request.projectPath,
    encoding: 'utf8',
    timeout: 15_000,
  });

  const events: SessionEvent[] = [
    {
      type: 'session.started',
      timestamp: new Date().toISOString(),
      summary: `Started ${adapter.displayName} session.`,
      metadata: { command: adapter.command, args },
    },
  ];

  if (result.stdout) {
    events.push(createStreamEvent('stdout', result.stdout));
  }
  if (result.stderr) {
    events.push(createStreamEvent('stderr', result.stderr));
  }

  events.push({
    type: 'session.exited',
    timestamp: new Date().toISOString(),
    summary: `Session exited with code ${result.status ?? -1}.`,
    metadata: { exitCode: result.status ?? -1 },
  });

  const summary = summarizeSessionEvents(events);

  return {
    adapter: adapter.id,
    exitCode: result.status ?? -1,
    events,
    spokenSummary: summary.headline,
  };
}
