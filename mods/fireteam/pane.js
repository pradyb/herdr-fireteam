// A pane's header: a slim HUD tag. Operator (callsign, role, weapon), its state word, the title and
// folder, then split / zoom / close. The accent line shows which pane has the keyboard.

import { panes, props, run } from "herdr";
import { pal, ACT, actOf, txt, head, icon, div, h_flex, opOf, colorOf, STATUS, clip, stop } from "./kit.js";

export default class PaneHead {
  render(_cx) {
    const P = pal(), me = props()?.pane, p = panes().find((x) => x.pane === me);
    if (!p) return div().size_full().bg(P.panel);
    const isOp = Boolean(p.terminal) && (p.status || p.program?.shell), o = isOp ? opOf(p.terminal, p.program) : null;
    const btn = (id, glyph, fn, danger) => div().id(`${id}-${me}`).w(22).h(20).flex_none().flex().items_center().justify_center().cursor_pointer()
      .hover((s) => s.bg(danger ? P.bad : P.panel2)).on_mouse_down("left", stop).on_click(fn).child(txt(glyph, 14, P.text, 800));
    return h_flex().id(`ph-${me}`).size_full().px(10).gap(9).items_center().bg(p.focused ? P.panel2 : P.panel)
      .border_b_1().border_color(p.focused ? P.accent : P.line).on_click(() => run("pane.focus", { pane: me }))
      .when(Boolean(o), (e) => e.child(icon("op-helmet", 16, 16, colorOf(P, p.status ?? "idle")))
        .child(head(o.call, 13, p.focused ? P.accent : P.text).flex_none())
        .child(icon(o.gunIcon, 26, 9, o.camo ?? P.dim)).child(txt(`${o.role}`, 11, P.dim, 700).flex_none()))
      .when(!o, (e) => e.child(head(clip(p.title || "TERMINAL", 24), 13, P.text).flex_none()))
      .when(Boolean(p.status), (e) => e.child(txt((p.status === "working" && ACT[actOf(p.terminal)]) || STATUS[p.status]?.word || "", 11, colorOf(P, p.status), 800).flex_none()))
      .child(txt(`${p.status && p.title ? p.title + "  ·  " : ""}${p.cwd ?? ""}${p.branch ? `  ⎇ ${p.branch}` : ""}`, 12, P.dim, 600).flex_1().min_w(0).truncate())
      .child(h_flex().flex_none().gap(2)
        .child(btn("sr", "┃", () => run("pane.split", { pane: me, direction: "right" })))
        .child(btn("sd", "━", () => run("pane.split", { pane: me, direction: "down" })))
        .child(btn("zm", "▢", () => run("pane.zoom", { pane: me })))
        .child(btn("cl", "×", () => run("pane.close", { pane: me }), true)));
  }
}
