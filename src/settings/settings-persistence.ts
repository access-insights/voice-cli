import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname } from 'node:path';
import type { AppSettings } from './settings-store.ts';
import { defaultSettings } from './settings-store.ts';

export function loadSettings(path: string): AppSettings {
  if (!existsSync(path)) {
    return defaultSettings();
  }
  const raw = readFileSync(path, 'utf8');
  return { ...defaultSettings(), ...JSON.parse(raw) };
}

export function saveSettings(path: string, settings: AppSettings): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(settings, null, 2));
}
