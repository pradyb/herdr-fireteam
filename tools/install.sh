#!/bin/sh
# Install (or update) Fireteam into the Herdr app's home, and link its Claude Code hook.
#
#   tools/install.sh            copy the layout, its themes and its mod; link the hook
#   tools/install.sh --quiet    no output
#
# The repo is the only source. The copy in the Herdr home is real files (Herdr loads images and
# hot-reloads mods only from real paths inside its home, not through symlinks): edit the repo, run
# this again. HERDR_APP_HOME picks another Herdr home (default ~/.config/herdr-app).
set -eu

REPO=$(cd "$(dirname "$0")/.." && pwd)
DEST=${HERDR_APP_HOME:-"$HOME/.config/herdr-app"}
QUIET=0
for a in "$@"; do
  case "$a" in
    --quiet) QUIET=1 ;;
    *) echo "unknown option: $a" >&2; exit 2 ;;
  esac
done
say() { [ "$QUIET" = 1 ] || echo "$@"; }

[ -d "$DEST" ] || { echo "Herdr home not found: $DEST (start the Herdr app once first)" >&2; exit 1; }
mkdir -p "$DEST/mods" "$DEST/layouts" "$DEST/themes"

rsync -a --delete --exclude '.DS_Store' "$REPO/mods/fireteam/" "$DEST/mods/fireteam/"
for f in layouts/Fireteam.json layouts/Fireteam.svg themes/Fireteam*.json; do rsync -a "$REPO/$f" "$DEST/$f"; done
say "Fireteam installed in $DEST"

# the Claude Code hook behind hit-markers, damage and live actions: register it in ~/.claude/settings.json (see README)
mkdir -p "$HOME/.claude/hooks"
ln -sfn "$REPO/hooks/fireteam-activity.py" "$HOME/.claude/hooks/fireteam-activity.py"
say "Claude Code hook linked: ~/.claude/hooks/fireteam-activity.py"
