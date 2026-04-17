import { existsSync, statSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

export function validateProjectPathInMain(projectPath) {
  const normalizedPath = String(projectPath || '').trim();
  if (!normalizedPath) {
    return {
      ok: false,
      valid: false,
      projectPath: '',
      helpText: 'Enter a local project path.',
    };
  }
  if (!existsSync(normalizedPath)) {
    return {
      ok: true,
      valid: false,
      projectPath: normalizedPath,
      helpText: 'That path does not exist.',
    };
  }

  try {
    const stats = statSync(normalizedPath);
    if (!stats.isDirectory()) {
      return {
        ok: true,
        valid: false,
        projectPath: normalizedPath,
        helpText: 'That path exists, but it is not a directory.',
      };
    }
  } catch (error) {
    return {
      ok: false,
      valid: false,
      projectPath: normalizedPath,
      helpText: error instanceof Error ? error.message : String(error),
    };
  }

  return {
    ok: true,
    valid: true,
    projectPath: normalizedPath,
    helpText: `Project path looks valid: ${normalizedPath}`,
  };
}

export function detectCodexCliInMain() {
  const configured = String(process.env.VOICE_CLI_CODEX_COMMAND || 'codex').trim() || 'codex';
  const whichResult = spawnSync('bash', ['-lc', `command -v ${configured}`], {
    cwd: process.cwd(),
    encoding: 'utf8',
    env: process.env,
    timeout: 10000,
  });

  const binaryPath = whichResult.status === 0 ? whichResult.stdout.trim() : '';
  const detected = Boolean(binaryPath && existsSync(binaryPath));

  return {
    ok: true,
    cli: 'codex',
    command: configured,
    detected,
    binaryPath: detected ? binaryPath : '',
    helpText: detected
      ? `Codex CLI detected at ${binaryPath}.`
      : 'Codex CLI was not found on PATH. Install it or set VOICE_CLI_CODEX_COMMAND.',
  };
}
