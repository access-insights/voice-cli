# Quick Start

## Current prototype state

voice-cli currently provides a foundation scaffold and thin vertical slice for:
- managed Codex CLI session execution
- event normalization
- transcript persistence
- transcript preview generation
- voice interaction scaffolding

## Near-term setup flow

1. Clone the repository.
2. Ensure Codex CLI is installed and available on PATH.
3. Run the current slice:

```bash
npm run slice
```

4. Inspect generated artifacts under:
- `.voice-cli/sessions/`
- `.voice-cli/transcript-preview.html`
