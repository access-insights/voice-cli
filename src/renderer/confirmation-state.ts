import type { ConfirmationRequest } from '../safety/confirmation-flow.ts';

export interface RendererConfirmationState {
  activeRequest: ConfirmationRequest | null;
}

export function createEmptyConfirmationState(): RendererConfirmationState {
  return {
    activeRequest: null,
  };
}
