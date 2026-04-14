import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { SessionRunResult } from '../session/session-runner.ts';

export function persistSessionRun(baseDir: string, result: SessionRunResult): string {
  mkdirSync(baseDir, { recursive: true });
  const filePath = join(baseDir, `${Date.now()}-session.json`);
  writeFileSync(filePath, JSON.stringify(result, null, 2));
  return filePath;
}
