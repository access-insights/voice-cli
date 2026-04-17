import { mkdirSync, writeFileSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

function ensureSessionDir(baseDir = process.cwd()) {
  const dir = join(baseDir, '.voice-cli', 'sessions');
  mkdirSync(dir, { recursive: true });
  return dir;
}

function toSummaryRecord(name, raw) {
  return {
    fileName: name,
    adapter: raw.adapter ?? 'unknown',
    exitCode: raw.exitCode ?? -1,
    spokenSummary: raw.spokenSummary ?? 'No summary',
    timestampGuess: name.split('-session.json')[0],
  };
}

export function persistSessionRecord(baseDir, record) {
  const dir = ensureSessionDir(baseDir);
  const filePath = join(dir, `${Date.now()}-session.json`);
  writeFileSync(filePath, JSON.stringify(record, null, 2));
  return filePath;
}

export function persistSessionSummary(baseDir, summary) {
  return persistSessionRecord(baseDir, summary);
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
      return toSummaryRecord(name, raw);
    });
}

export function loadSessionRecord(baseDir = process.cwd(), fileName) {
  const dir = ensureSessionDir(baseDir);
  const path = join(dir, fileName);
  const raw = JSON.parse(readFileSync(path, 'utf8'));
  return {
    ...toSummaryRecord(fileName, raw),
    events: Array.isArray(raw.events) ? raw.events : [],
    transcript: Array.isArray(raw.transcript) ? raw.transcript : [],
    runtimeSummary: raw.runtimeSummary ?? null,
    pendingPrompt: raw.pendingPrompt ?? null,
  };
}
