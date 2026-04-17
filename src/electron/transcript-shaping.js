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

function classifyStreamChunk(source, raw, fallbackSummary) {
  const cleaned = cleanRawOutput(raw);
  const lines = cleaned.split('\n').map((line) => line.trim()).filter(Boolean);

  if (source === 'stderr' && lines.length) {
    const userIndex = lines.indexOf('user');
    const codexIndex = lines.indexOf('codex');

    if (userIndex !== -1 && codexIndex !== -1) {
      const userText = lines.slice(userIndex + 1, codexIndex).join('\n').trim();
      const assistantText = lines.slice(codexIndex + 1).join('\n').trim();
      const entries = [];
      if (userText) entries.push({ kind: 'user', source: 'user', summary: userText, raw: userText });
      if (assistantText) entries.push({ kind: 'assistant', source: 'assistant', summary: assistantText, raw: assistantText });
      if (entries.length) return entries;
    }
  }

  return [{
    kind: source === 'stderr' ? 'tool' : 'assistant',
    source,
    summary: cleaned || fallbackSummary || 'No summary',
    raw: cleaned || raw || '',
  }];
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
      entries.push({
        kind: 'lifecycle',
        source: 'system',
        summary: event.summary || 'Session is running.',
        raw: '',
      });
      continue;
    }

    if (event.type === 'prompt.detected' || event.type === 'error.detected') {
      entries.push({
        kind: event.type === 'prompt.detected' ? 'prompt' : 'error',
        source: event.source || 'system',
        summary: event.summary || 'No summary',
        raw: cleanRawOutput(event.raw || '') || event.raw || '',
      });
      continue;
    }

    if (event.type === 'session.started' || event.type === 'session.exited') {
      entries.push({
        kind: 'lifecycle',
        source: 'system',
        summary: event.summary || 'No summary',
        raw: '',
      });
    }
  }

  return entries;
}
