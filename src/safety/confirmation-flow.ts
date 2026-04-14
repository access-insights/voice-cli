export interface ConfirmationRequest {
  id: string;
  actionLabel: string;
  reason: string;
  riskLevel: 'low' | 'medium' | 'high';
  requiresExplicitApproval: boolean;
}

export function createConfirmationRequest(actionLabel: string, reason: string, riskLevel: 'low' | 'medium' | 'high'): ConfirmationRequest {
  return {
    id: `${Date.now()}-${actionLabel.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    actionLabel,
    reason,
    riskLevel,
    requiresExplicitApproval: riskLevel !== 'low',
  };
}
