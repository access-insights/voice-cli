import type { ConfirmationRequest } from '../safety/confirmation-flow.ts';

export interface PromptResponse {
  confirmationId: string;
  approved: boolean;
  responseText: string;
}

export function buildPromptResponse(request: ConfirmationRequest, approved: boolean): PromptResponse {
  return {
    confirmationId: request.id,
    approved,
    responseText: approved ? 'yes\n' : 'no\n',
  };
}
