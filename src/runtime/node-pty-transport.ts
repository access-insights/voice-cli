import pty from 'node-pty';
import type { IPty } from 'node-pty';
import { createStreamEvent } from '../session/event-normalizer.ts';
import type { SessionEvent } from '../session/event-types.ts';
import type { TerminalTransport, TransportStartOptions } from './transport.ts';

export class NodePtyTransport implements TerminalTransport {
  private ptyProcess: IPty | null = null;
  private events: SessionEvent[] = [];
  private eventListeners: Array<(event: SessionEvent) => void> = [];
  private exitListeners: Array<(exitCode: number) => void> = [];

  start(options: TransportStartOptions): void {
    this.ptyProcess = pty.spawn(options.command, options.args, {
      name: 'xterm-color',
      cols: 120,
      rows: 30,
      cwd: options.cwd,
      env: process.env as Record<string, string>,
    });

    const startEvent: SessionEvent = {
      type: 'session.started',
      timestamp: new Date().toISOString(),
      summary: `Started PTY process ${options.command}.`,
      metadata: { transport: 'node-pty', command: options.command, args: options.args },
    };
    this.events.push(startEvent);
    this.emitEvent(startEvent);

    this.ptyProcess.onData((data) => {
      const source = /error|failed|exception/i.test(data) ? 'stderr' : 'stdout';
      const event = createStreamEvent(source, data);
      this.events.push(event);
      this.emitEvent(event);
    });

    this.ptyProcess.onExit(({ exitCode }) => {
      const exitEvent: SessionEvent = {
        type: 'session.exited',
        timestamp: new Date().toISOString(),
        summary: `PTY process exited with code ${exitCode}.`,
        metadata: { exitCode, transport: 'node-pty' },
      };
      this.events.push(exitEvent);
      this.emitEvent(exitEvent);
      for (const listener of this.exitListeners) listener(exitCode);
    });
  }

  sendInput(input: string): void {
    this.ptyProcess?.write(input);
  }

  getEvents(): SessionEvent[] {
    return [...this.events];
  }

  onEvent(listener: (event: SessionEvent) => void): void {
    this.eventListeners.push(listener);
  }

  onExit(listener: (exitCode: number) => void): void {
    this.exitListeners.push(listener);
  }

  private emitEvent(event: SessionEvent): void {
    for (const listener of this.eventListeners) listener(event);
  }
}
