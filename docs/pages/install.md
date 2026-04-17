# Install

## Public beta expectation

voice-cli intends to ship installable beta binaries for:
- macOS
- Windows
- Linux

## Current prototype state

A first Linux packaging path is now being wired for local AppImage builds, but packaged beta binaries should still be treated as pre-release and Linux-first.

## Linux notes

The current Linux packaging target is AppImage.

Some Linux hosts require FUSE support to run AppImages directly. On machines missing `libfuse.so.2`, the artifact may build correctly but fail to launch until the host AppImage/FUSE dependency is installed.

## Planned install flow

1. Download the Linux beta artifact when available.
2. Ensure AppImage/FUSE host requirements are present.
3. Launch voice-cli.
4. Complete first-run setup.
5. Confirm Codex CLI detection.
6. Choose and validate a local project.
7. Test voice settings and transcript behavior.
