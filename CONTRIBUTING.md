# Contributing

## Setup

```sh
git clone https://github.com/pradyb/herdr-fireteam
cd herdr-fireteam
tools/install.sh        # copies the layout, themes and mod into ~/.config/herdr-app, links the hook
herdr-app do layout.switch '{"name":"Fireteam"}'
```

Herdr loads images and hot-reloads mods only from real files inside its home, so edit the repo and run
`tools/install.sh` again (it is quick). If a layout ever misbehaves, `ctrl-alt-shift-escape` resets Herdr to its
default layout.

## Before opening a PR

```sh
herdr-app check mods/fireteam      # loads every role of the mod once
python3 -m py_compile hooks/fireteam-activity.py
sh -n tools/install.sh
```

Then try it in the real app, and refresh `preview.png` with `tools/preview.sh` if the look changed (it uses
invented demo data from `mods/fireteam/demo.js`, so no real projects end up in the screenshot).

## Where things are

- `mods/fireteam/kit.js`: palettes (`PACKS`), callsigns, roles, weapons, camos, perks, ranks, streaks
- `mods/fireteam/side.js`: the event watcher (status changes and hook files into the shared `fireteam.*` state)
- one file per HUD piece: `top.js`, `squad.js`, `side.js`, `pane.js`, `popup.js`, `map.js`, `loadout.js`
- `layouts/Fireteam.json`: sizes and the layout tree

CI runs the file checks (JSON, hook, installer, layout-to-mod) for every push and PR; `herdr-app check` needs the app, so run it yourself.

## Guidelines

- Keep the mod dependency-free and natively drawn (no PNG chrome); the only images are small SVG icons.
- No network calls and no programs run from the mod (`exec`, `hc`). The hook uses the Python standard library only (3.8+).
- A perk or feature isn't done until it does something visible in the HUD, and its description says what.
- Never put real project names, paths, tokens or session names in code, `demo.js` or screenshots.
- Update the README and `RECIPE.md` if you change user-facing behaviour, and add an entry to `CHANGELOG.md` for any change users would notice.
- New hook events: add the field to the top of `hooks/fireteam-activity.py`, read it in `side.js`, and show it (popup, stat or action).

## Questions

For usage questions or half-formed ideas, use
[Discussions](https://github.com/pradyb/herdr-fireteam/discussions) rather than
the issue tracker. Issues are for reproducible bugs and concrete feature requests.
