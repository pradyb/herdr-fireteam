// Fireteam: a military-shooter HUD for Herdr. One mod, roles picked by props.role:
//   top   logo, compass with objective markers, rank, clock
//   squad agents as operators, spaces as operations, tabs as contracts
//   side  radar, kill feed, scorestreaks, ammo counter (also the event watcher)
//   foot  key hints and the camo-pack switcher
//   pane  a pane's header (props.pane)
//   popup the floating XP banner over the terminal
//   map   the operations map overlay
//   loadout weapon / camo / perks dialog (props.address)
//   debrief match-results dialog

import { S } from "./kit.js";
import { View, div } from "gpui-kit";
import { props, setShared, shared } from "herdr";
import Top from "./top.js";
import Squad from "./squad.js";
import Side, { openMap, openDebrief } from "./side.js";
import PaneHead from "./pane.js";
import Popup from "./popup.js";
import MapView from "./map.js";
import Loadout from "./loadout.js";
import Debrief from "./debrief.js";
import { demoTerm } from "./demo.js";
import { pal, PACKS, txt, h_flex, stop } from "./kit.js";

class Foot {
  render() {
    const P = pal();
    return h_flex().id("foot").size_full().px(12).gap(14).items_center().bg(P.bg).border_t_1().border_color(P.line)
      .child(h_flex().id("map-btn").px(8).h(18).items_center().border_1().border_color(P.accent).cursor_pointer().on_mouse_down("left", stop).on_click(openMap)
        .child(txt("MAP", 11, P.accent, 800)))
      .child(h_flex().id("debrief-btn").px(8).h(18).items_center().border_1().border_color(P.line).cursor_pointer().on_mouse_down("left", stop).on_click(openDebrief)
        .child(txt("DEBRIEF", 11, P.dim, 800)))
      .child(txt("CTRL+SHIFT+M MAP · CTRL+SHIFT+D DEBRIEF · CTRL+SHIFT+B SQUAD · CTRL+SHIFT+J RADAR · CLICK A DIAMOND, BLIP OR OPERATOR TO JUMP", 11, P.dim, 700).flex_1().min_w(0).truncate())
      .child(h_flex().id("sfx-btn").px(8).h(18).items_center().border_1().border_color(P.line).cursor_pointer().on_mouse_down("left", stop)
        .on_click(() => setShared("fireteam.mute", !S("fireteam.mute"))).child(txt(S("fireteam.mute") ? "SFX OFF" : "SFX ON", 11, S("fireteam.mute") ? P.dim : P.accent, 800)))
      .child(txt(`CAMO ${P.name}`, 11, P.dim, 800))
      .child(h_flex().gap(4).children(PACKS.map((k, i) => div().id(`pack-${i}`).w(18).h(10).bg(k.accent).cursor_pointer()
        .border_1().border_color(k.name === P.name ? "#ffffff" : "#00000000").tooltip(k.name)
        .on_mouse_down("left", stop).on_click(() => setShared("fireteam.pack", i)))));
  }
}

class DemoTerm { render() { return demoTerm(div, pal()); } } // preview only (tools/preview.sh)

const ROLES = { demoterm: DemoTerm, top: Top, squad: Squad, side: Side, foot: Foot, pane: PaneHead, popup: Popup, map: MapView, loadout: Loadout, debrief: Debrief };

export default class CodHud extends View {
  init(p, cx) {
    const pr = props() ?? p ?? {};
    const R = ROLES[pr.role] ?? (pr.pane ? PaneHead : null);
    this.role = R ? new R() : null;
    this.role?.init?.(pr, cx);
    // No role (herdr-app check): every role at once, so the check covers them all.
    if (!this.role) this.all = Object.values(ROLES).map((K) => { const r = new K(); r.init?.(pr, cx); return r; });
  }

  render(cx) {
    if (!this.role) return div().flex().flex_col().size_full().children(this.all.map((r) => r.render(cx)).filter((e) => e !== "").map((e) => div().h(260).child(e)));
    return this.role.render(cx);
  }
}
