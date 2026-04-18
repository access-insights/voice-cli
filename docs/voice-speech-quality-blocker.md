# Voice Speech Quality Blocker

## Goal
Run a stronger transcription-quality check using a short spoken sample rather than a tone.

## Current blocker on this machine
- `spd-say` is available
- `espeak` / `espeak-ng` are not available
- no local WAV-capable speech sample generator was available in the current environment
- `ffmpeg` is not available for easy conversion from another source format

## What was attempted
- generate a spoken WAV sample locally
- fall back to available local TTS tooling

## Result
A stronger semantic speech-quality check is still blocked until we have either:
- a short real spoken sample file, or
- a local toolchain that can generate a spoken WAV artifact

## Ready path when a sample exists
Use:

```bash
bash scripts/test-whisper-speech-quality.sh /path/to/short-spoken-sample.wav
```

This will validate both transcription and prompt-load behavior against a real speech sample.
