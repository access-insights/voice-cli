import { spawn } from 'node:child_process';

function pickLinuxTtsCommand() {
  const configured = process.env.VOICE_CLI_TTS_COMMAND;
  if (configured) return configured;
  return 'spd-say';
}

export function speakTextInMain(text, options = {}) {
  const normalized = String(text || '').trim();
  if (!normalized) {
    return { ok: false, reason: 'No text provided.', fallbackRecommended: true };
  }

  const command = pickLinuxTtsCommand();
  const args = [];
  const rate = Number.isFinite(options.rate) ? options.rate : 1.0;

  if (command.endsWith('spd-say') || command === 'spd-say') {
    const spdRate = Math.max(-100, Math.min(100, Math.round((rate - 1) * 100)));
    args.push('-r', String(spdRate), normalized);
  } else if (command.endsWith('espeak') || command.endsWith('espeak-ng') || command === 'espeak' || command === 'espeak-ng') {
    const wordsPerMinute = Math.max(80, Math.min(260, Math.round(175 * rate)));
    args.push('-s', String(wordsPerMinute), normalized);
  } else {
    args.push(normalized);
  }

  try {
    const child = spawn(command, args, {
      detached: true,
      stdio: 'ignore',
    });
    child.on('error', () => {});
    child.unref();
    return {
      ok: true,
      backend: command,
      text: normalized,
      rate,
      mode: 'fire-and-forget',
      fallbackRecommended: false,
    };
  } catch (error) {
    return {
      ok: false,
      reason: error instanceof Error ? error.message : String(error),
      backend: command,
      rate,
      fallbackRecommended: true,
    };
  }
}
