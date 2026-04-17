import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

function ensureVoiceTempDir(projectPath = process.cwd()) {
  const dir = join(projectPath, '.voice-cli', 'voice');
  mkdirSync(dir, { recursive: true });
  return dir;
}

export function persistCapturedAudioInMain(bufferBase64, options = {}) {
  const payload = String(bufferBase64 || '').trim();
  if (!payload) {
    return { ok: false, reason: 'No audio payload provided.' };
  }

  const dir = ensureVoiceTempDir(process.cwd());
  const extension = String(options.extension || 'webm').replace(/[^a-z0-9]/gi, '') || 'webm';
  const filePath = join(dir, `${Date.now()}-capture.${extension}`);

  try {
    const buffer = Buffer.from(payload, 'base64');
    writeFileSync(filePath, buffer);
    return {
      ok: true,
      filePath,
      bytes: buffer.byteLength,
      mimeType: options.mimeType || '',
    };
  } catch (error) {
    return {
      ok: false,
      reason: error instanceof Error ? error.message : String(error),
    };
  }
}
