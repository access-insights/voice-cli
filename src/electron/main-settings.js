import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

function defaultElectronSettings() {
  return {
    preferredCli: 'codex',
    preferredVoice: 'default-male',
    speechRate: 1.2,
    transcriptMode: 'summary-first',
    requireRiskConfirmation: true,
    onboardingProjectPath: '',
    onboardingProjectValid: false,
    onboardingCodexPath: '',
    onboardingCodexDetected: false,
  };
}

function getSettingsPath(projectPath = process.cwd()) {
  return join(projectPath, '.voice-cli', 'settings.json');
}

export function loadElectronSettings(projectPath = process.cwd()) {
  const settingsPath = getSettingsPath(projectPath);
  if (!existsSync(settingsPath)) {
    return defaultElectronSettings();
  }

  const raw = readFileSync(settingsPath, 'utf8');
  return {
    ...defaultElectronSettings(),
    ...JSON.parse(raw),
  };
}

export function saveElectronSettings(nextSettings, projectPath = process.cwd()) {
  const settingsPath = getSettingsPath(projectPath);
  const merged = {
    ...loadElectronSettings(projectPath),
    ...(nextSettings || {}),
  };
  mkdirSync(dirname(settingsPath), { recursive: true });
  writeFileSync(settingsPath, JSON.stringify(merged, null, 2));
  return merged;
}
