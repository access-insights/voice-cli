import { spawn } from 'node:child_process';
import { EventEmitter } from 'node:events';
import { createStreamEvent } from '../session/event-normalizer.ts';
import type { SessionEvent } from '../session/event-types.ts';
import type { TerminalTransport, TransportStartOptions } from './transport.ts';

export class SpawnTransport implements TerminalTransport {
  private child: ReturnType<typeof spawn> | null = null;
  private events: SessionEvent[] = [];
  private emitter = new EventEmitter();

  start(options: TransportStartOptions): void {
    this.child = spawn(options.command, options.args, {
      cwd: options.cwd,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: process.env,
    });

    this.events.push({
      type: 'session.started',
      timestamp: new Date().toISOString(),
      summary: `Started process ${options.command}.`,
      metadata: { command: options.command, args: options.args, transport: 'spawn' },
    });

    this.child.stdout?.on('data', (chunk) => {
      const event = createStreamEvent('stdout', String(chunk));
      this.events.push(event);
      this.emitter.emit('event', event);
    });

    this.child.stderr?.on('data', (chunk) => {
      const event = createStreamEvent('stderr', String(chunk));
      this.events.push(event);
      this.emitter.emit('event', event);
    });

    this.child.on('exit', (code) => {
      const event: SessionEvent = {
        type: 'session.exited',
        timestamp: new Date().toISOString(),
        summary: `Process exited with code ${code ?? -1}.`,
        metadata: { exitCode: code ?? -1, transport: 'spawn' },
      };
      this.events.push(event);
      this.emitter.emit('event', event);
      this.emitter.emit('exit', code ?? -1);
    });
  }

  sendInput(input: string): void {
    this.child?.stdin?.write(input);
  }

  getEvents(): SessionEvent[] {
    return [...this.events];
  }

  onEvent(listener: (event: SessionEvent) => void): void {
    this.emitter.on('event', listener);
  }

  onExit(listener: (exitCode: number) => void): void {
    this.emitter.on('exit', listener);
  }
}
