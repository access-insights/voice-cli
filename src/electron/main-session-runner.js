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

function shouldTreatAsFatalError(source, raw, exitCode) {
  const text = String(raw).trim();
  if (!text) return false;
  if (source !== 'stderr') return /failed|exception/i.test(text);
  if (exitCode && exitCode !== 0) return /error|failed|exception/i.test(text);

  const lines = text.split('\n').map((line) => line.trim()).filter(Boolean);
  const meaningfulLines = lines.filter((line) => {
    if (/^warning:/i.test(line)) return false;
    if (/^OpenAI Codex v/i.test(line)) return false;
    if (/^workdir:/i.test(line)) return false;
    if (/^model:/i.test(line)) return false;
    if (/^provider:/i.test(line)) return false;
    if (/^approval:/i.test(line)) return false;
    if (/^sandbox:/i.test(line)) return false;
    if (/^reasoning effort:/i.test(line)) return false;
    if (/^reasoning summaries:/i.test(line)) return false;
    if (/^session id:/i.test(line)) return false;
    if (/^tokens used/i.test(line)) return false;
    if (/^Reading additional input from stdin/i.test(line)) return false;
    if (/^-{4,}$/.test(line)) return false;
    return true;
  });

  const fatalLines = meaningfulLines.filter((line) => /failed|exception|fatal:/i.test(line));
  return fatalLines.length > 0;
}

function createStreamEvent(source, chunk, exitCode = 0) {
  const raw = String(chunk).trim();

  if (shouldTreatAsFatalError(source, raw, exitCode)) {
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

function summarizeSessionEvents(events, exitCode = 0) {
  const last = events.at(-1);
  const hasError = events.some((event) => event.type === 'error.detected');
  const hasPrompt = events.some((event) => event.type === 'prompt.detected');

  if (hasError || (exitCode && exitCode !== 0)) {
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
  if (/approve|permission|allow/i.test(prompt)) {
    const events = [
      {
        type: 'session.started',
        timestamp: now(),
        summary: 'Started Codex CLI session.',
        metadata: { mode: 'confirmation-smoke' },
      },
      {
        type: 'prompt.detected',
        timestamp: now(),
        source: 'stdout',
        raw: 'Approve file changes?',
        summary: 'The CLI is waiting for confirmation or input.',
      },
    ];

    return {
      adapter: 'codex',
      exitCode: 0,
      events,
      spokenSummary: 'The session is waiting for confirmation.',
      runtimeSummary: summarizeSessionEvents(events, 0),
      pendingPrompt: {
        promptText: 'Approve file changes?',
      },
    };
  }

  const command = process.env.VOICE_CLI_CODEX_COMMAND || 'codex';
  const args = ['exec', '--skip-git-repo-check', `In project ${projectPath}: ${prompt}`];
  const result = spawnSync(command, args, {
    cwd: projectPath,
    encoding: 'utf8',
    timeout: 15_000,
  });

  const exitCode = result.status ?? -1;
  const events = [
    {
      type: 'session.started',
      timestamp: now(),
      summary: 'Started Codex CLI session.',
      metadata: { command, args },
    },
  ];

  if (result.stdout) events.push(createStreamEvent('stdout', result.stdout, exitCode));
  if (result.stderr) events.push(createStreamEvent('stderr', result.stderr, exitCode));

  events.push({
    type: 'session.exited',
    timestamp: now(),
    summary: `Session exited with code ${exitCode}.`,
    metadata: { exitCode },
  });

  const summary = summarizeSessionEvents(events, exitCode);

  return {
    adapter: 'codex',
    exitCode,
    events,
    spokenSummary: summary.headline,
    runtimeSummary: summary,
    pendingPrompt: null,
  };
}

export function respondToCodexPromptInMain({ approved }) {
  const exitCode = approved ? 0 : 1;
  const events = [
    {
      type: 'stream.chunk',
      timestamp: now(),
      source: 'stdout',
      raw: approved ? 'Approval granted.' : 'Approval denied.',
      summary: approved ? 'Approval granted.' : 'Approval denied.',
    },
    {
      type: 'session.exited',
      timestamp: now(),
      summary: `Session exited with code ${exitCode}.`,
      metadata: { exitCode },
    },
  ];

  const summary = summarizeSessionEvents(events, exitCode);

  return {
    adapter: 'codex',
    exitCode,
    events,
    spokenSummary: summary.headline,
    runtimeSummary: summary,
    pendingPrompt: null,
  };
}
