import type { TranscriptLine } from '../app/renderer-model.ts';

export function renderTranscriptShell(lines: TranscriptLine[]): string {
  const items = lines
    .map((line) => `<li><strong>${line.role}</strong> [${line.mode}] ${escapeHtml(line.text)}</li>`)
    .join('');

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>voice-cli transcript</title>
  </head>
  <body>
    <main>
      <h1>voice-cli transcript</h1>
      <p>This shell proves transcript-first access for spoken and textual interaction.</p>
      <ul>${items}</ul>
    </main>
  </body>
</html>`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
