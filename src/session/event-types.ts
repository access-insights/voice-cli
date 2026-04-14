export type StreamSource = 'stdout' | 'stderr' | 'system';

export type SessionEventType =
  | 'session.started'
  | 'session.exited'
  | 'stream.chunk'
  | 'prompt.detected'
  | 'error.detected'
  | 'summary.generated';

export interface SessionEvent {
  type: SessionEventType;
  timestamp: string;
  summary: string;
  raw?: string;
  source?: StreamSource;
  metadata?: Record<string, unknown>;
}

export interface SessionSummary {
  status: 'running' | 'completed' | 'failed';
  headline: string;
  detailsAvailable: boolean;
}
