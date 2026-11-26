// The XP popup: a floating banner over the terminal for a couple of seconds after an event
// (hit, damage, contract clear, commit, push, drone). Hit-marker cross on the left, points on the right.

import { S } from "./kit.js";
import { shared } from "herdr";
import { pal, txt, head, div, h_flex } from "./kit.js";

const LIFE = 2600;

export default class Popup {
  render(cx) {
    const P = pal(), p = S("fireteam.pop"), age = p ? Date.now() - p.t : Infinity;
    if (!p || age > LIFE) return ""; // nothing to show: an empty view hides the floating block
    if (this.sched !== p.t) { this.sched = p.t; cx.timer.after(LIFE - age + 60, (cx) => cx.notify()); }
    const c = { hit: P.text, kill: P.accent, dmg: P.bad, info: P.warn }[p.kind] ?? P.text;
    return h_flex().id("popup").px(14).py(6).gap(12).items_center().bg(P.panel)
      .child(txt(p.kind === "dmg" ? "✚" : "✕", 22, c, 800).loop("opacity", { from: 0.55, to: 1, period: 260 }))
      .child(div().flex().flex_col().gap(1)
        .child(head(p.text, 16, c))
        .child(txt(`${p.who}${p.pts ? `  ·  +${p.pts} XP` : ""}`, 11, P.dim, 700)));
  }
}
