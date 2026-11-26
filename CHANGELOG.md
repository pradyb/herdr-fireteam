# Changelog

All notable changes to Fireteam are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
