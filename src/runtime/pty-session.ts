import { spawn } from 'node:child_process';
import { EventEmitter } from 'node:events';
import { createStreamEvent } from '../session/event-normalizer.ts';
import type { SessionEvent } from '../session/event-types.ts';

export interface PtySessionOptions {
  cwd: string;
  command: string;
  args: string[];
}

export class PtySession extends EventEmitter {
  private child: ReturnType<typeof spawn> | null = null;
  private events: SessionEvent[] = [];

  start(options: PtySessionOptions): void {
    this.child = spawn(options.command, options.args, {
      cwd: options.cwd,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: process.env,
    });

    this.events.push({
      type: 'session.started',
      timestamp: new Date().toISOString(),
      summary: `Started process ${options.command}.`,
      metadata: { command: options.command, args: options.args },
    });

    this.child.stdout?.on('data', (chunk) => {
      const event = createStreamEvent('stdout', String(chunk));
      this.events.push(event);
      this.emit('event', event);
    });

    this.child.stderr?.on('data', (chunk) => {
      const event = createStreamEvent('stderr', String(chunk));
      this.events.push(event);
      this.emit('event', event);
    });

    this.child.on('exit', (code) => {
      const event: SessionEvent = {
        type: 'session.exited',
        timestamp: new Date().toISOString(),
        summary: `Process exited with code ${code ?? -1}.`,
        metadata: { exitCode: code ?? -1 },
      };
      this.events.push(event);
      this.emit('event', event);
      this.emit('exit', code ?? -1);
    });
  }

  sendInput(input: string): void {
    this.child?.stdin?.write(input);
  }

  getEvents(): SessionEvent[] {
    return [...this.events];
  }
}
