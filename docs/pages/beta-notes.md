# Beta Notes

## Current status

voice-cli now has a Linux-first Electron runtime, transcript persistence, bounded voice loop, and bounded onboarding flow. Linux packaging is being hardened next.

## Before public beta

The project still needs:
- packaged-app launch validation on a Linux host with AppImage/FUSE support
- onboarding validation in packaged apps
- accessibility review
- install documentation validation
- session interaction polish

## Current Linux packaging note

A local AppImage build now succeeds, but direct launch validation depends on host AppImage/FUSE support. Missing `libfuse.so.2` is currently the known host-side blocker on some machines.
