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

Keep to the project's rules: native drawing only (no PNG chrome), no network calls, no programs run from the mod,
and a perk or feature isn't done until it does something visible.
