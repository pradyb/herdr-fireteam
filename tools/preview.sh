#!/bin/sh
# Regenerate preview.png from the running Herdr app with invented demo data (mods/fireteam/demo.js), so
# the screenshot never shows anyone's projects or terminal. Switches to a temporary demo layout, shoots,
# and switches back. Needs the app running, the mod installed (tools/install.sh) and python3, sips (macOS).
set -eu
REPO=$(cd "$(dirname "$0")/.." && pwd)
DEST=${HERDR_APP_HOME:-"$HOME/.config/herdr-app"}
PREV=$(herdr-app status | python3 -c 'import json,sys; print(json.load(sys.stdin)["layout"])')
python3 - "$REPO/layouts/Fireteam.json" "$DEST/layouts/Fireteam-Demo.json" <<'PY'
import json, sys
def walk(n):
    c = n.get("content") or {}
    if c.get("mod") == "fireteam":
        c["props"] = {**c.get("props", {}), "demo": True}
    if n.get("id") == "main":
        n["content"] = {"mod": "fireteam", "props": {"role": "demoterm", "demo": True}}
        n.pop("floating", None)
    for k in n.get("children", []): walk(k)
l = json.load(open(sys.argv[1])); walk(l); json.dump(l, open(sys.argv[2], "w"), indent=2)
PY
herdr-app do layout.switch '{"name":"Fireteam-Demo"}' >/dev/null
sleep 5
herdr-app shot "$REPO/preview.png" >/dev/null
sips --resampleWidth 1920 "$REPO/preview.png" >/dev/null
herdr-app do layout.switch "{\"name\":\"$PREV\"}" >/dev/null
rm -f "$DEST/layouts/Fireteam-Demo.json"
echo "preview.png written; back on $PREV"
