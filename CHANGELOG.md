# Changelog

All notable changes to Fireteam are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.4.3]

### Changed
- File edits (DIRECT HIT) are silent too: every hit pops up without a sound; tests, commits, pushes, clears, damage and streaks keep theirs

## [0.4.2]

### Changed
- A command run (Bash) still pops COMMAND RUN but no longer plays a sound; edits and the other events keep theirs

## [0.4.1]

### Fixed
- Operations: long operation names are no longer cut off by the branch (the header reads `5 · NAME`, the branch is shorter)

## [0.4.0]

### Added
- Operations: each contract shows the folder of its terminal before the tab name (real case, tab name dimmer)
- Operations: the git branch on each operation header, and elapsed minutes on a working contract

## [0.3.0]

### Added
- Medals: DOUBLE and TRIPLE CLEAR, FLAWLESS, BOSS DOWN and FIRST BLOOD on a finished contract, in the popup and the kill feed
- Daily challenges: three a day (always "clear 5 contracts"), a segmented bar each in a new right-column panel, 50 XP of rank when done
- Weapon mastery: weapons level 1 to 10 with hits and unlock camos; level shown in the loadout and on the card, with a level-up banner

### Changed
- Loadout: weapons are grouped by category (assault, SMG, LMG, sniper, shotgun, pistol, launcher); the Dragunov is now listed as a sniper

## [0.2.0]

### Added
- Codex and Gemini CLI support in the hook: `fireteam-activity.py codex|gemini` (beta, from their docs, checked with `tools/test_hook.py`)
- Debrief dialog (`ctrl-shift-d`, DEBRIEF button): totals, per-operator stats and an MVP
- A sound for each scorestreak you call in
- Separate AK-47 and bullpup (FR 556) weapon silhouettes
- The operations map shows each operator's weapon

### Fixed
- Cold-Blooded now also hides the TARGETS MISSED popup and sound for a failed test run

### Changed
- Squad rows show the operator's weapon silhouette in the left slot instead of the same helmet for everyone
- README: new "Reading the HUD" section
- `LICENSE` is plain MIT so GitHub detects it; the hook credit, font and sound notes moved to `NOTICE`

## [0.1.0]

### Added
- A game-style HUD layout for herdr-app: compass with objective markers, squad, operations, radar, kill feed, scorestreaks, operator card
- Loadout screen: weapon, camo and three perks per operator, every perk with a real HUD effect
- XP popup, five synthesised sounds with an SFX switch, operations map (`ctrl-shift-m`)
- Live actions, hit and damage events and stats from a Claude Code hook
- Five camo packs (palettes) with matching terminal themes
- Demo mode and `tools/preview.sh` for screenshots that show no real projects
