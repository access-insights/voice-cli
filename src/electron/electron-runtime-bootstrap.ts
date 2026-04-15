import { createHandlerRegistry } from './handler-registry.ts';
import { registerIpcHandlers } from './ipc-register.ts';
import { contextBridgeExpose } from './preload.ts';
import { detectElectronRuntime, type ElectronRuntimeLike } from './electron-adapter.ts';

export interface ElectronRuntimeBootstrapResult {
  mode: 'electron' | 'fallback';
  registeredChannels: string[];
  bridgeExposed: boolean;
}

export function bootstrapElectronRuntime(target: Record<string, unknown>, runtime?: ElectronRuntimeLike): ElectronRuntimeBootstrapResult {
  const availability = detectElectronRuntime(runtime);
  const registry = createHandlerRegistry(process.cwd());
  const registeredChannels = runtime?.ipcMain ? registerIpcHandlers(runtime.ipcMain, registry) : [];

  if (runtime?.contextBridge) {
    contextBridgeExpose(target, runtime.contextBridge);
  } else {
    contextBridgeExpose(target);
  }

  return {
    mode: availability.mode,
    registeredChannels,
    bridgeExposed: true,
  };
}
