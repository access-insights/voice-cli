import type { ConfirmationRequest } from '../safety/confirmation-flow.ts';

export function confirmationRequestToVoicePrompt(request: ConfirmationRequest): string {
  return `Confirmation required. ${request.actionLabel}. Reason: ${request.reason}.`;
}
