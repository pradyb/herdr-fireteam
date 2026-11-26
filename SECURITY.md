# Security Policy

## Supported Versions

Only the latest release (and the latest commit on `main`) is actively supported with security fixes.

## Reporting a Vulnerability

**Please do not open a public GitHub issue for security vulnerabilities.**

Report security issues privately using
[GitHub's private vulnerability reporting](https://github.com/pradyb/herdr-fireteam/security/advisories/new).

## Scope

The mod makes no network calls and runs no programs. It reads
`~/.local/state/fireteam/<terminal>.json` (written by the optional Claude Code hook) and plays its own sound files.
The hook reads Claude Code's hook event from stdin and writes only that state folder.
