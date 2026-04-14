# Prompt Response Handling

## Goal

When a CLI requests confirmation, the app should be able to:
- explain the request clearly
- capture an approval or denial
- convert that into transport input

## Current scaffold

- `src/runtime/prompt-response.ts`
- `src/voice/prompt-voice-policy.ts`
- `scripts/test-prompt-response.sh`

## Current behavior

- converts a confirmation request into yes/no transport input
- generates a spoken prompt suitable for the voice layer

## Future work

- wire renderer approval actions to transport sendInput
- wire spoken confirmations into the same response path
