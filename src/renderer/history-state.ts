import type { StoredSessionSummary } from '../persistence/session-history.ts';

export interface HistoryViewState {
  sessions: StoredSessionSummary[];
}

export function createEmptyHistoryState(): HistoryViewState {
  return {
    sessions: [],
  };
}
