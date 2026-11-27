// Top bar: logo and operation, the compass strip, rank and clock. The compass is the in-game kind:
// a heading scale with cardinals, and a diamond for every operator at its own bearing (red and
// flashing when it is under fire). Click a diamond to jump to that operator. The heading is the
// focused operator's, so switching terminals turns the compass.

import { S, agentsNow, spacesNow } from "./kit.js";
import { agents, spaces, focused, run } from "herdr";
import { pal, hash, sessionOf, hasPerk, focusedHas, txt, head, icon, div, h_flex, v_flex, opOf, colorOf, rankNow, prestigeNow, zulu, stop, clip, pad2 } from "./kit.js";
import { shared } from "herdr";

const W = 600, SPAN = 90, PPD = W / 2 / SPAN; // px per degree
const CARD = { 0: "N", 45: "NE", 90: "E", 135: "SE", 180: "S", 225: "SW", 270: "W", 315: "NW" };

export default class Top {
  init(_p, cx) {
    this.now = new Date();
    cx.timer.every(30_000, (cx) => { this.now = new Date(); cx.notify(); });
  }

  compass(P, b, ags) {
    const el = div().relative().flex_none().w(W).h(44).overflow_hidden();
    for (let a = Math.floor((b - SPAN) / 5) * 5; a <= b + SPAN; a += 5) {
      const x = W / 2 + (a - b) * PPD, deg = ((a % 360) + 360) % 360, major = deg % 15 === 0;
      el.child(div().absolute().left(x).top(24).w(1).h(major ? 8 : 4).bg(major ? P.text : P.dim));
      const lab = CARD[deg] ?? (deg % 30 === 0 ? String(deg) : null);
      if (lab) el.child(div().absolute().left(x - 14).top(33).w(28).flex().justify_center().child(txt(lab, CARD[deg] ? 12 : 10, CARD[deg] ? P.accent : P.dim, 700)));
    }
    for (const a of ags) {
      const o = opOf(a.address, a.program);
      const rel = ((o.bearing - b + 540) % 360) - 180, edge = Math.abs(rel) > SPAN, r = Math.max(-SPAN, Math.min(SPAN, rel));
      let m = div().id(`obj-${a.address}`).absolute().left(W / 2 + r * PPD - 8).top(4).w(16).flex().justify_center().cursor_pointer()
        .tooltip(`${o.call} · ${sessionOf(a)} · ${a.status}`).on_mouse_down("left", stop).on_click(() => run("agent.focus", { terminal: a.address }))
        .opacity(hasPerk(a.address, "ghost") ? (focusedHas(ags, "tracker") ? 0.4 : 0.12) : edge ? 0.35 : 1).child(txt("◆", 15, colorOf(P, a.status), 800));
      if (a.status === "blocked") m = m.loop("opacity", { from: 0.25, to: 1, period: 520 });
      el.child(m);
    }
    return el.child(div().absolute().left(W / 2 - 10).top(0).w(20).flex().justify_center().child(txt("▼", 9, P.accent, 800)))
      .child(div().absolute().left(W / 2 - 22).top(10).w(44).flex().justify_center().child(txt(pad2(Math.round(b)).padStart(3, "0"), 11, P.text, 700)));
  }

  render(_cx) {
    const P = pal(), ags = agentsNow(), sps = spacesNow();
    const f = focused(), cur = ags.find((a) => a.address === f?.terminal) ?? ags.find((a) => a.focused);
    const bearing = cur ? opOf(cur.address, cur.program).bearing : 0;
    const sp = sps.find((s) => s.active), rk = rankNow();
    const rank = h_flex().flex_none().gap(8).items_center()
      .child(head(`${prestigeNow() ? `★${prestigeNow()} ` : ""}${rk.name}`, 18, P.accent))
      .child(v_flex().gap(3)
        .child(txt(rk.max ? "MAX RANK" : `${rk.into}/${rk.of} CONTRACTS`, 11, P.dim, 700))
        .child(h_flex().gap(2).children(Array.from({ length: 4 }, (_, i) => div().w(16).h(4).bg(i < Math.ceil((rk.into * 4) / rk.of) ? P.accent : P.line)))));
    return div().id("top").size_full().flex().items_center().px(10).gap(16).bg(P.bg).border_b_1().border_color(P.line)
      .child(div().w(76).flex_none())
      .child(h_flex().flex_none().gap(9).items_center().w(250)
        .child(icon("op-helmet", 24, 24, P.accent))
        .child(v_flex().gap(1).child(head("Fireteam", 17, P.text)).child(txt(cur && sessionOf(cur) ? `▸ ${clip(sessionOf(cur).toUpperCase(), 26)}` : `OP ${sp ? sp.index : 1} · ${clip(sp?.name ?? "HQ", 22).toUpperCase()}`, 12, cur && sessionOf(cur) ? P.accent : P.dim, 800))))
      .child(div().flex_1().min_w(0).flex().justify_center().child(this.compass(P, bearing, ags)))
      .child(rank)
      .child(v_flex().flex_none().items_end().gap(1).child(head(zulu(this.now), 18, P.text)).child(txt("LOCAL", 10, P.dim, 700)));
  }
}
