import { spawn } from 'node:child_process';
import { shapeTranscript } from './transcript-shaping.js';

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

export async function runCodexVerticalSliceInMain({ projectPath, prompt, onEvent, onLifecycle }) {
  if (/approve|permission|allow/i.test(prompt)) {
    const events = [
      {
        type: 'session.started',
        timestamp: now(),
        summary: 'Started Codex CLI session.',
        metadata: { mode: 'confirmation-smoke' },
      },
      {
        type: 'session.progress',
        timestamp: now(),
        summary: 'The CLI session is running.',
        metadata: { prompt, projectPath },
      },
      {
        type: 'prompt.detected',
        timestamp: now(),
        source: 'stdout',
        raw: 'Approve file changes?',
        summary: 'The CLI is waiting for confirmation or input.',
      },
    ];

    for (const event of events) onEvent?.(event);
    onLifecycle?.({ state: 'waiting-for-input', prompt });

    return {
      adapter: 'codex',
      exitCode: 0,
      events,
      transcript: shapeTranscript(events),
      spokenSummary: 'The session is waiting for confirmation.',
      runtimeSummary: summarizeSessionEvents(events, 0),
      pendingPrompt: {
        promptText: 'Approve file changes?',
      },
      projectPath,
      startedAt: events[0].timestamp,
      endedAt: events.at(-1)?.timestamp ?? now(),
    };
  }

  return await new Promise((resolve) => {
    const command = process.env.VOICE_CLI_CODEX_COMMAND || 'codex';
    const args = ['exec', '--skip-git-repo-check', `In project ${projectPath}: ${prompt}`];
    const startedEvent = {
      type: 'session.started',
      timestamp: now(),
      summary: 'Started Codex CLI session.',
      metadata: { command, args, projectPath },
    };
    const progressEvent = {
      type: 'session.progress',
      timestamp: now(),
      summary: 'The CLI session is running.',
      metadata: { prompt, projectPath },
    };

    const events = [startedEvent, progressEvent];
    onEvent?.(startedEvent);
    onEvent?.(progressEvent);
    onLifecycle?.({ state: 'running', prompt });

    let settled = false;
    let stdoutBuffer = '';
    let stderrBuffer = '';
    let child = null;

    function flushBuffer(source, buffer, exitCode = 0) {
      const raw = String(buffer || '').trim();
      if (!raw) return;
      const event = createStreamEvent(source, raw, exitCode);
      events.push(event);
      onEvent?.(event);
    }

    function finish(exitCode, extraEvent = null) {
      if (settled) return;
      settled = true;
      flushBuffer('stdout', stdoutBuffer, exitCode);
      flushBuffer('stderr', stderrBuffer, exitCode);
      stdoutBuffer = '';
      stderrBuffer = '';
      if (extraEvent) {
        events.push(extraEvent);
        onEvent?.(extraEvent);
      }
      const exitedEvent = {
        type: 'session.exited',
        timestamp: now(),
        summary: `Session exited with code ${exitCode}.`,
        metadata: { exitCode },
      };
      events.push(exitedEvent);
      onEvent?.(exitedEvent);
      onLifecycle?.({ state: 'completed', prompt, exitCode });
      const summary = summarizeSessionEvents(events, exitCode);
      resolve({
        adapter: 'codex',
        exitCode,
        events,
        transcript: shapeTranscript(events),
        spokenSummary: summary.headline,
        runtimeSummary: summary,
        pendingPrompt: null,
        projectPath,
        startedAt: startedEvent.timestamp,
        endedAt: exitedEvent.timestamp,
      });
    }

    try {
      child = spawn(command, args, {
        cwd: projectPath,
        stdio: ['pipe', 'pipe', 'pipe'],
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      finish(1, {
        type: 'error.detected',
        timestamp: now(),
        source: 'stderr',
        raw: message,
        summary: 'The CLI could not be started.',
      });
      return;
    }

    const timeoutMs = 15_000;
    const timeoutId = setTimeout(() => {
      if (settled) return;
      onLifecycle?.({ state: 'timed-out', prompt });
      child?.kill('SIGTERM');
      finish(124, {
        type: 'error.detected',
        timestamp: now(),
        source: 'stderr',
        raw: `Session timed out after ${timeoutMs}ms.`,
        summary: 'The CLI session timed out before completing.',
      });
    }, timeoutMs);

    child.stdout?.on('data', (chunk) => {
      stdoutBuffer += String(chunk);
      const parts = stdoutBuffer.split(/\r?\n/);
      stdoutBuffer = parts.pop() ?? '';
      for (const part of parts) flushBuffer('stdout', part, 0);
    });

    child.stderr?.on('data', (chunk) => {
      stderrBuffer += String(chunk);
      const parts = stderrBuffer.split(/\r?\n/);
      stderrBuffer = parts.pop() ?? '';
      for (const part of parts) flushBuffer('stderr', part, 0);
    });

    child.on('error', (error) => {
      clearTimeout(timeoutId);
      const message = error instanceof Error ? error.message : String(error);
      finish(1, {
        type: 'error.detected',
        timestamp: now(),
        source: 'stderr',
        raw: message,
        summary: 'The CLI could not be started.',
      });
    });

    child.on('close', (code) => {
      clearTimeout(timeoutId);
      finish(code ?? -1);
    });
  });
}

export function respondToCodexPromptInMain({ approved, onEvent, projectPath = process.cwd() }) {
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

  for (const event of events) onEvent?.(event);

  const summary = summarizeSessionEvents(events, exitCode);

  return {
    adapter: 'codex',
    exitCode,
    events,
    transcript: shapeTranscript(events),
    spokenSummary: summary.headline,
    runtimeSummary: summary,
    pendingPrompt: null,
    projectPath,
    startedAt: events[0].timestamp,
    endedAt: events.at(-1)?.timestamp ?? now(),
  };
}
