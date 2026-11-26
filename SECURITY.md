# Security Policy

## Supported Versions

Only the latest release (and the latest commit on `main`) is actively supported with security fixes.

## Reporting a Vulnerability

**Please do not open a public GitHub issue for security vulnerabilities.**

Report security issues privately using
[GitHub's private vulnerability reporting](https://github.com/pradyb/herdr-fireteam/security/advisories/new).

Include:
- A description of the vulnerability and its potential impact
- Steps to reproduce (proof-of-concept if possible)
- Your suggested fix or mitigation (optional)

You can expect an acknowledgement within **72 hours**.

## What It Reads and Runs

- The mod makes no network calls and runs no programs. It reads `~/.local/state/fireteam/<terminal>.json` (written by the
  optional Claude Code hook) and plays its own sound files.
- `hooks/fireteam-activity.py` runs as a Claude Code hook. It reads the hook event JSON from stdin and writes only
  `~/.local/state/fireteam/`. It does nothing outside Herdr (no `HC_TERMINAL_ID`). It never runs the commands it sees:
  it only pattern-matches them (tests, commit, push) after stripping quoted text and heredocs.
- `tools/install.sh` copies the layout, themes and mod into the Herdr home and links the hook into `~/.claude/hooks/`.
  Read it before running, as you would any install script.

## Scope

In scope: any way a hook event, a terminal title or a state file could make the mod or the hook run something,
write outside its state folder, or read files it was not meant to.

Out of scope: vulnerabilities in Herdr or Claude Code themselves (report those to their projects), and a modified
copy of the hook or settings you chose to install.
