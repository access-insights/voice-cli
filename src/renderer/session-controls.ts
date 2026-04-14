export interface SessionControlState {
  canStartSession: boolean;
  canSendInput: boolean;
  currentInputDraft: string;
}

export function createDefaultSessionControls(): SessionControlState {
  return {
    canStartSession: true,
    canSendInput: false,
    currentInputDraft: '',
  };
}
