import { mkdirSync, writeFileSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

function ensureSessionDir(baseDir = process.cwd()) {
  const dir = join(baseDir, '.voice-cli', 'sessions');
  mkdirSync(dir, { recursive: true });
  return dir;
}

export function persistSessionSummary(baseDir, summary) {
  const dir = ensureSessionDir(baseDir);
  const filePath = join(dir, `${Date.now()}-session.json`);
  writeFileSync(filePath, JSON.stringify(summary, null, 2));
  return filePath;
}

export function loadSessionSummaries(baseDir = process.cwd()) {
  const dir = ensureSessionDir(baseDir);
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
