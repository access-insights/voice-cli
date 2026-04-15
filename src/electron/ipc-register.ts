import type { HandlerRegistry } from './handler-registry.ts';

export interface IpcMainLike {
  handle(channel: string, handler: (...args: unknown[]) => unknown): void;
}

export function registerIpcHandlers(ipcMainLike: IpcMainLike, registry: HandlerRegistry): string[] {
  const registeredChannels: string[] = [];

  for (const [channel, handler] of Object.entries(registry)) {
    ipcMainLike.handle(channel, async (_event: unknown, ...args: unknown[]) => handler(...args));
    registeredChannels.push(channel);
  }

  return registeredChannels;
}
