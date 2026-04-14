import type { RuntimeHealthSummary } from '../runtime/runtime-summary.ts';
import type { ConfirmationRequest } from '../safety/confirmation-flow.ts';

export interface RuntimeViewState {
  runtimeSummary: RuntimeHealthSummary;
  confirmation: ConfirmationRequest | null;
}
