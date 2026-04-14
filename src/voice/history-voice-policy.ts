import type { StoredSessionSummary } from '../persistence/session-history.ts';

export function summarizeHistoryForVoice(history: StoredSessionSummary[]): string {
  if (history.length === 0) {
    return 'There is no session history yet.';
  }

  const latest = history[0];
  return `The latest session used ${latest.adapter} and ended with exit code ${latest.exitCode}. Summary: ${latest.spokenSummary}`;
}
