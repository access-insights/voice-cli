import { spawnSync } from 'node:child_process';

function now() {
  return new Date().toISOString();
}

function summarizeChunk(raw) {
  if (!raw) return 'No output captured.';
  if (/changed files?|diff/i.test(raw)) {
    return 'The CLI reported file changes. Ask for changed files or diff details.';
  }
  return raw.length > 160 ? `${raw.slice(0, 157)}...` : raw;
}

function createStreamEvent(source, chunk) {
  const raw = String(chunk).trim();

  if (/error|failed|exception/i.test(raw)) {
    return {
      type: 'error.detected',
      timestamp: now(),
      source,
      raw,
      summary: 'The CLI reported an error. Ask for details to hear the raw output.',
    };
  }

  if (/\?\s*$|continue\?|allow|approve|permission/i.test(raw)) {
    return {
      type: 'prompt.detected',
      timestamp: now(),
      source,
      raw,
      summary: 'The CLI is waiting for confirmation or input.',
    };
  }

  return {
    type: 'stream.chunk',
    timestamp: now(),
    source,
    raw,
    summary: summarizeChunk(raw),
  };
}

function summarizeSessionEvents(events) {
  const last = events.at(-1);
  const hasError = events.some((event) => event.type === 'error.detected');
  const hasPrompt = events.some((event) => event.type === 'prompt.detected');

  if (hasError) {
    return {
      status: 'failed',
      headline: 'The session reported an error.',
      detailsAvailable: true,
    };
  }

  if (hasPrompt) {
    return {
      status: 'running',
      headline: 'The session is waiting for confirmation.',
      detailsAvailable: true,
    };
  }

  return {
    status: 'completed',
    headline: last?.summary ?? 'The session completed without notable output.',
    detailsAvailable: events.some((event) => Boolean(event.raw)),
  };
}

export function runCodexVerticalSliceInMain({ projectPath, prompt }) {
  const command = process.env.VOICE_CLI_CODEX_COMMAND || 'codex';
  const args = ['exec', '--skip-git-repo-check', `In project ${projectPath}: ${prompt}`];
  const result = spawnSync(command, args, {
    cwd: projectPath,
    encoding: 'utf8',
    timeout: 15_000,
  });

  const events = [
    {
      type: 'session.started',
      timestamp: now(),
      summary: 'Started Codex CLI session.',
      metadata: { command, args },
    },
  ];

  if (result.stdout) events.push(createStreamEvent('stdout', result.stdout));
  if (result.stderr) events.push(createStreamEvent('stderr', result.stderr));

  events.push({
    type: 'session.exited',
    timestamp: now(),
    summary: `Session exited with code ${result.status ?? -1}.`,
    metadata: { exitCode: result.status ?? -1 },
  });

  const summary = summarizeSessionEvents(events);

  return {
    adapter: 'codex',
    exitCode: result.status ?? -1,
    events,
    spokenSummary: summary.headline,
    runtimeSummary: summary,
  };
}
