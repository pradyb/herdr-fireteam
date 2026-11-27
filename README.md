# Fireteam

A military-shooter HUD for [Herdr](https://herdr.dev) (the **herdr-app** GUI build). Your coding agents become
a fireteam of operators, and the window becomes the game HUD around one big terminal: a compass with objective
markers, a squad widget, a radar, a kill feed, scorestreaks, XP popups with sound, and a loadout screen with
weapons, camo and perks that really change the HUD.

![Fireteam](preview.png)

This is an unofficial community layout, inspired by the look of modern military shooters. It is not affiliated
with or endorsed by Herdr or by any game publisher, and it uses no official art, logos, fonts or characters.
Everything is drawn natively from live Herdr data; the screenshot above uses invented demo data.

## What you get

| HUD piece | What it is |
|---|---|
| **Compass** (top) | A heading scale with a diamond per operator at its own bearing, red and flashing when it is under fire. Click one to jump to it. The heading is the focused operator's. |
| **Squad** (left) | Every agent as an operator: `[unit] callsign`, role, weapon silhouette, live action, state word, five armour plates, and its **session name**. The gear opens its loadout. |
| **Operations** (left) | Spaces as operations, tabs as contracts. |
| **Radar** (right) | A blip per operator and a sweep. Click a blip to jump. |
| **Kill feed** | A finished contract is a kill: `[unit] callsign <weapon> CONTRACT`. Also under fire, engaged, deployed, extracted, commits and pushes. |
| **Scorestreaks** | Charged by finished contracts: UAV 3 (jump to the operator under fire), Cruise 5 (jump to a finished one), Gunship 7 (zoom the terminal), Juggernaut 9 (new terminal). |
| **Operator card** | The focused operator: weapon, live action and stats from real tool calls (DAMAGE edits and commands, ACCURACY successes vs failures, RECON reads, DRONES subagents). |
| **XP popup + sound** | A banner over the terminal for DIRECT HIT, DAMAGE TAKEN, CONTRACT ACCEPTED/CLEAR, RANGE CLEAR (tests), INTEL SECURED (commit), EXFIL CONFIRMED (push), DRONE DEPLOYED (subagent). Nine synthesised sounds, including a stinger for each scorestreak you call in; `SFX ON/OFF` in the bottom bar. |
| **Loadout** | The gear on a row, LOADOUT on the card, or `ctrl-shift-o`: 9 weapons (assault rifle, AK and bullpup have their own silhouettes), 8 camos, 3 perk slots. Saved per terminal. |
| **Operations map** | `ctrl-shift-m` or the MAP button: operations as grid zones, contracts as pins, operators standing on them. Click to jump. |
| **Medals** | Bonus banners on a finished contract: DOUBLE / TRIPLE CLEAR (several within a minute), FLAWLESS (no tool failures), BOSS DOWN (3 or more failures), FIRST BLOOD (first of the day). Also in the kill feed. |
| **Challenges** | Three a day, the same all day, reset at midnight: always "clear 5 contracts" plus two of tests, pushes, commits, flawless clears, medals, drones. Each is worth 50 XP of rank. |
| **Weapon mastery** | A weapon levels up (1 to 10) with hits from any operator carrying it: successful edits and commands. Levels unlock camos for that weapon (Desert 2, Arctic 3, Digital 4, Tiger 5, Gold 7, Dark Matter 10). The loadout shows the level, the card button shows `L6`, and a level-up pops a banner. Your hits so far count the first time. |
| **Rank** | PVT to GEN, one rank per 4 finished contracts (a challenge counts as two). |
| **Debrief** | `ctrl-shift-d` or the DEBRIEF button: contracts cleared, rank, streak points, and per-operator damage, accuracy, recon and drones with an MVP. |
| **Camo packs** | Click a swatch in the bottom bar: MODERN, NVG, ARCTIC, ZOMBIES, HAZARD. Matching terminal themes (`Fireteam`, `Fireteam-NVG`, …) are in the settings theme picker. |

**Perks** (each acts on the HUD): Ghost hides the operator from radar and compass; Cold-Blooded makes failed tools
do no damage (no popup, sound or accuracy hit); Quick Fix adds an armour plate; Scavenger adds a streak charge per
finished contract; Overkill doubles popup XP; Fast Hands pops RELOADED (+25 XP) when a context compaction ends;
Tracker (while that operator is focused) reveals Ghosts; Dead Silence mutes that operator's popups and sounds;
Hardline (while that operator is focused) makes streaks cost one contract less.

Roles come from the program: Claude Code is Recon, Codex Gunsmith, Gemini Medic, OpenCode/pi/amp/cursor
Marksman, shells Sentry, anything else Operator. Callsign and unit tag come from a hash of the terminal address.

## Reading the HUD

- **Unit tag** (`TF`, `SC`, `RG`, `GH`, `SP`): Task Force, Shadow Co., Rangers, Ghosts, Spetsnaz. Cosmetic only. `HQ` in the kill feed is the system itself.
- **Squad icon:** the operator's weapon. Its colour is the camo if one is set, otherwise the state colour.
- **Kill feed line** `callsign <weapon> target`: a finished contract. The red target is the tab name.
- **Scorestreak tile pulsing:** it has enough charge. Click it to spend the cost and use it. All operators share one pool of charge.
- **Rank and XP** (top right): each finished contract is +25 XP and four make a rank, so `XP 25/100` is one contract in. A completed challenge adds 50 XP. The kill total counts contracts only.
- **Locked camo** (dimmed, `LVL 7`): that weapon needs that level first. A camo you already wear stays usable.
- **Medals and challenges:** FLAWLESS, BOSS DOWN and the test, push, commit and drone challenges need the agent hook; without it, only clears, double and triple clears, first blood and the clear challenge work.
- **Clock** (`2315Z`): your local time, written in a military style. It is not UTC.

## Install

Ask your agent to add `herdr.dev/layouts/pradyb/herdr-fireteam`, or:

```sh
git clone https://github.com/pradyb/herdr-fireteam
cd herdr-fireteam
tools/install.sh                                  # layout, themes, mod into ~/.config/herdr-app; links the hook
herdr-app do layout.switch '{"name":"Fireteam"}'
```

Then merge `mods/fireteam/KEYS.json` into your `keys.json`: `ctrl-shift-m` map, `ctrl-shift-d` debrief, `ctrl-shift-o` loadout,
`ctrl-shift-b` squad column, `ctrl-shift-j` radar column. Run `tools/install.sh` again after a `git pull`.
It installs real files, not symlinks: Herdr hot-reloads mods and loads images only from real files in its home.
Back to your own layout any time with `ctrl-shift-l`; `ctrl-alt-shift-escape` resets to the default layout.

### Live events (optional: Claude Code, Codex, Gemini CLI)

Herdr itself reports four states (working, blocked, done, idle). The hook adds a live action per agent, hit and
damage events, and the stats. `tools/install.sh` links `hooks/fireteam-activity.py` to `~/.claude/hooks/`; register
it in `~/.claude/settings.json` for `UserPromptSubmit`, `PreToolUse`, `PostToolUse`, `PostToolUseFailure`,
`PreCompact`, `SubagentStart`, `SubagentStop`, `Stop`, `SessionStart`, `SessionEnd`. Each entry looks like this:

```json
{ "hooks": [{ "type": "command", "command": "python3 \"$HOME/.claude/hooks/fireteam-activity.py\" 2>/dev/null || true", "timeout": 5 }] }
```

It answers at once (async), does nothing outside Herdr, and writes `~/.local/state/fireteam/<terminal>.json`.
Without it the HUD still works from Herdr's four states.

**Codex and Gemini CLI** use the same script with an argument (`codex` or `gemini`), which maps their event and tool names
onto the same live actions. These two are written from their public hook docs and checked with sample payloads
(`python3 tools/test_hook.py`), not yet run against the real agents, so treat them as beta and open an issue if one misbehaves.

Codex (`~/.codex/hooks.json`; review and trust it once with `/hooks`). Repeat the entry for `UserPromptSubmit`, `PreToolUse`,
`PostToolUse`, `PreCompact`, `PostCompact`, `Stop`, `Interrupt`, `SubagentStart`, `SubagentStop`, `SessionStart`, `SessionEnd`:

```json
{ "hooks": { "PreToolUse": [{ "hooks": [{ "type": "command", "command": "python3 \"$HOME/.claude/hooks/fireteam-activity.py\" codex", "async": true, "timeout": 5 }] }] } }
```

Gemini CLI (`~/.gemini/settings.json`). Repeat for `BeforeAgent`, `AfterAgent`, `BeforeTool`, `AfterTool`, `PreCompress`,
`SessionStart`, `SessionEnd` (Gemini waits for hooks, the script answers in milliseconds):

```json
{ "hooks": { "BeforeTool": [{ "matcher": "*", "hooks": [{ "type": "command", "command": "python3 \"$HOME/.claude/hooks/fireteam-activity.py\" gemini", "timeout": 5000 }] }] } }
```

Codex has no tool-failure event, so its DAMAGE TAKEN and failed-test popups never fire; Claude Code and Gemini report both.

## What it reads and runs

- `~/.local/state/fireteam/<terminal>.json`, if the hook is installed.
- Its own folder (art, sounds, fonts).
- Nothing else: no network calls, no programs run, no files written outside Herdr's shared state.

## Customise

Everything visual is in `mods/fireteam/kit.js`: the `PACKS` palettes, `CALLSIGNS`, `UNITS`, `ROLES` (weapon per
role), `WEAPONS`, `CAMOS`, `PERKS`, `STREAKS` and `RANKS`. Sizes are in `layouts/Fireteam.json`. See
[CONTRIBUTING.md](CONTRIBUTING.md) and [RECIPE.md](RECIPE.md).

## Credits

By pradyb, MIT licensed (see [LICENSE](LICENSE) and [NOTICE](NOTICE)). The Claude Code hook is derived from
[World of Codecraft](https://github.com/kevinpardo/world-of-codecraft) by Kevin Pardo (MIT). The sounds are
synthesised by `tools/make_sounds.py`. Fonts: Saira Stencil One and Rajdhani, SIL Open Font License.
