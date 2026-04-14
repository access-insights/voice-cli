# Event Model

## Principle

voice-cli should never treat terminal text as spoken output directly by default.

Instead, terminal activity flows through:
- raw terminal capture
- normalized event extraction
- spoken summary generation

## Event categories

- session.lifecycle.started
- session.lifecycle.exited
- process.stdout.chunk
- process.stderr.chunk
- process.prompt.detected
- process.confirmation.required
- process.error.detected
- process.output.summarized
- repo.files.changed
- repo.diff.available
- adapter.status.changed
- transcript.user.request
- transcript.assistant.summary
- transcript.assistant.verbatim

## Trust rules

- spoken content must be labeled internally as summary or verbatim
- the user must be able to request raw output at any time
- dangerous or ambiguous actions should produce explicit confirmation-needed events
