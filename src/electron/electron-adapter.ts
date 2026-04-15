export interface ContextBridgeLike {
  exposeInMainWorld(name: string, api: unknown): void;
}

export interface IpcMainLike {
  handle(channel: string, handler: (...args: unknown[]) => unknown): void;
}

export interface ElectronRuntimeLike {
  contextBridge?: ContextBridgeLike;
  ipcMain?: IpcMainLike;
}

export interface ElectronAdapterAvailability {
  contextBridgeAvailable: boolean;
  ipcMainAvailable: boolean;
  mode: 'electron' | 'fallback';
}

export function detectElectronRuntime(runtime?: ElectronRuntimeLike): ElectronAdapterAvailability {
  return {
    contextBridgeAvailable: Boolean(runtime?.contextBridge?.exposeInMainWorld),
    ipcMainAvailable: Boolean(runtime?.ipcMain?.handle),
    mode: runtime?.contextBridge?.exposeInMainWorld || runtime?.ipcMain?.handle ? 'electron' : 'fallback',
  };
}
