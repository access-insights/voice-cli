import { existsSync, mkdirSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export interface StoredSessionSummary {
  fileName: string;
  adapter: string;
  exitCode: number;
  spokenSummary: string;
  timestampGuess: string;
}

export function ensureSessionDir(baseDir: string): string {
  const dir = join(baseDir, '.voice-cli', 'sessions');
  mkdirSync(dir, { recursive: true });
  return dir;
}

export function loadSessionHistory(baseDir: string): StoredSessionSummary[] {
  const dir = ensureSessionDir(baseDir);
  if (!existsSync(dir)) return [];

  return readdirSync(dir)
    .filter((name) => name.endsWith('-session.json'))
    .sort()
    .reverse()
    .map((name) => {
      const path = join(dir, name);
      const raw = JSON.parse(readFileSync(path, 'utf8'));
      return {
        fileName: name,
        adapter: raw.adapter ?? 'unknown',
        exitCode: raw.exitCode ?? -1,
        spokenSummary: raw.spokenSummary ?? 'No summary',
        timestampGuess: name.split('-session.json')[0],
      };
    });
}
