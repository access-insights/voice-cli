function cleanRawOutput(raw) {
  const lines = String(raw)
    .split('\n')
    .filter((line) => {
      const trimmed = line.trim();
      if (!trimmed) return false;
      if (/^OpenAI Codex v/i.test(trimmed)) return false;
      if (/^workdir:/i.test(trimmed)) return false;
      if (/^model:/i.test(trimmed)) return false;
      if (/^provider:/i.test(trimmed)) return false;
      if (/^approval:/i.test(trimmed)) return false;
      if (/^sandbox:/i.test(trimmed)) return false;
      if (/^reasoning effort:/i.test(trimmed)) return false;
      if (/^reasoning summaries:/i.test(trimmed)) return false;
      if (/^session id:/i.test(trimmed)) return false;
      if (/^tokens used/i.test(trimmed)) return false;
      if (/^Reading additional input from stdin/i.test(trimmed)) return false;
      if (/^warning: Codex's Linux sandbox/i.test(trimmed)) return false;
      if (/^-{4,}$/.test(trimmed)) return false;
      return true;
    });

  return lines.join('\n').trim();
}

function createTranscriptEntry(kind, source, summary, raw, extras = {}) {
  return {
    kind,
    source,
    summary,
    raw,
    ...extras,
  };
}

function classifyStreamChunk(source, raw, fallbackSummary) {
  const cleaned = cleanRawOutput(raw);
  const lines = cleaned.split('\n').map((line) => line.trim()).filter(Boolean);

  if (/changed files?|diff/i.test(cleaned)) {
    return [createTranscriptEntry('change-hint', source, 'The CLI reported file changes or a diff.', cleaned || raw || '', {
      detailLabel: 'Changed files or diff hint',
    })];
  }

  if (source === 'stderr' && lines.length) {
    const userIndex = lines.indexOf('user');
    const codexIndex = lines.indexOf('codex');

    if (userIndex !== -1 && codexIndex !== -1) {
      const userText = lines.slice(userIndex + 1, codexIndex).join('\n').trim();
      const assistantText = lines.slice(codexIndex + 1).join('\n').trim();
      const entries = [];
      if (userText) entries.push(createTranscriptEntry('user', 'user', userText, userText));
      if (assistantText) entries.push(createTranscriptEntry('assistant', 'assistant', assistantText, assistantText, { detailLabel: 'Assistant raw output' }));
      if (entries.length) return entries;
    }
  }

  return [createTranscriptEntry(source === 'stderr' ? 'tool' : 'assistant', source, cleaned || fallbackSummary || 'No summary', cleaned || raw || '', {
    detailLabel: source === 'stderr' ? 'Tool raw output' : 'Assistant raw output',
  })];
}

export function shapeTranscript(events) {
  const entries = [];

  for (const event of Array.isArray(events) ? events : []) {
    if (event.type === 'stream.chunk') {
      const chunkEntries = classifyStreamChunk(event.source || 'stdout', event.raw || '', event.summary || 'No summary');
      for (const chunkEntry of chunkEntries) {
        const last = entries.at(-1);
        if (last && last.kind === chunkEntry.kind && last.source === chunkEntry.source) {
          last.summary = `${last.summary}\n${chunkEntry.summary}`.trim();
          last.raw = `${last.raw || ''}\n${chunkEntry.raw || ''}`.trim();
        } else {
          entries.push(chunkEntry);
        }
      }
      continue;
    }

    if (event.type === 'session.progress') {
      entries.push(createTranscriptEntry('lifecycle', 'system', event.summary || 'Session is running.', '', {
        detailLabel: 'System event details',
      }));
      continue;
    }

    if (event.type === 'prompt.detected' || event.type === 'error.detected') {
      entries.push(createTranscriptEntry(event.type === 'prompt.detected' ? 'prompt' : 'error', event.source || 'system', event.summary || 'No summary', cleanRawOutput(event.raw || '') || event.raw || '', {
        detailLabel: event.type === 'prompt.detected' ? 'Prompt details' : 'Error details',
      }));
      continue;
    }

    if (event.type === 'session.started' || event.type === 'session.exited') {
      entries.push(createTranscriptEntry('lifecycle', 'system', event.summary || 'No summary', '', {
        detailLabel: 'System event details',
      }));
    }
  }

  return entries;
}
