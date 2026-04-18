# Voice Interaction Core

## Goals

The voice core should:
- accept spoken requests
- produce concise spoken summaries
- allow drill-down into raw details
- preserve trust between summary and verbatim output

## Current implementation

The current Electron path includes:
- `src/electron/main-voice.js`
- `src/electron/main-transcription.js`
- `src/electron/main-audio-capture.js`
- renderer-side voice status and transcript-first fallback messaging in `src/renderer/page-script.js`

## Current policy

- summary-first by default
- raw output on demand
- explicit handling for prompts and errors
- language and voice preferences stored in a dedicated preferences model

## Current validated state

- local TTS invocation path exists
- Whisper transcription path works end to end on this machine
- prompt loading from transcription output works
- transcript-first fallback messaging is now explicit in the UI

## Future work

- stronger semantic speech-quality validation with a real spoken sample
- per-user voice configuration UI
- interruption handling
- queueing and playback policy
- transcript-linked playback controls
