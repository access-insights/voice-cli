import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

function getWhisperScriptPath() {
  return '/usr/lib/node_modules/openclaw/skills/openai-whisper-api/scripts/transcribe.sh';
}

export function loadTranscriptionTextInMain(filePath) {
  const normalizedPath = String(filePath || '').trim();
  if (!normalizedPath) {
    return { ok: false, reason: 'No transcription file path provided.' };
  }
  if (!existsSync(normalizedPath)) {
    return { ok: false, reason: `Transcription file not found: ${normalizedPath}` };
  }

  try {
    const text = readFileSync(normalizedPath, 'utf8').trim();
    return {
      ok: true,
      filePath: normalizedPath,
      text,
    };
  } catch (error) {
    return {
      ok: false,
      reason: error instanceof Error ? error.message : String(error),
      filePath: normalizedPath,
    };
  }
}

export function transcribeAudioInMain(audioPath, options = {}) {
  const normalizedPath = String(audioPath || '').trim();
  if (!normalizedPath) {
    return { ok: false, reason: 'No audio path provided.' };
  }
  if (!existsSync(normalizedPath)) {
    return { ok: false, reason: `Audio file not found: ${normalizedPath}` };
  }

  const scriptPath = getWhisperScriptPath();
  if (!existsSync(scriptPath)) {
    return { ok: false, reason: `Whisper helper not found: ${scriptPath}` };
  }

  const outPath = options.outPath || join(process.cwd(), '.voice-cli', 'last-transcription.txt');
  const args = [scriptPath, normalizedPath, '--out', outPath];
  if (options.language) args.push('--language', String(options.language));
  if (options.prompt) args.push('--prompt', String(options.prompt));
  if (options.model) args.push('--model', String(options.model));

  const result = spawnSync('bash', args, {
    cwd: process.cwd(),
    encoding: 'utf8',
    env: process.env,
    timeout: 120000,
  });

  if (result.status !== 0) {
    return {
      ok: false,
      reason: result.stderr?.trim() || result.stdout?.trim() || `Whisper transcription failed with exit code ${result.status ?? -1}.`,
      exitCode: result.status ?? -1,
    };
  }

  return {
    ok: true,
    provider: 'openai-whisper-api',
    model: options.model || 'whisper-1',
    audioPath: normalizedPath,
    outPath: result.stdout.trim() || outPath,
  };
}
