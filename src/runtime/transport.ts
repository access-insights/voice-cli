import type { SessionEvent } from '../session/event-types.ts';

export interface TransportStartOptions {
  cwd: string;
  command: string;
  args: string[];
}

export interface TerminalTransport {
  start(options: TransportStartOptions): void;
  sendInput(input: string): void;
  getEvents(): SessionEvent[];
  onEvent(listener: (event: SessionEvent) => void): void;
  onExit(listener: (exitCode: number) => void): void;
}
