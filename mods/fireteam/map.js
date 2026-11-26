// Operations map (ctrl-shift-m, or MAP in the bottom bar): a Warzone-style overview in a dialog.
// Every operation (space) is a named grid zone; its contracts (tabs) are objective pins; operators
// stand on their contract with their live action. Click a pin or an operator to jump there; click
// outside (or Esc) to close.

import { agentsNow, spacesNow } from "./kit.js";
import { spaces, agents, run, props, closeOverlay } from "herdr";
import { pal, sessionOf, hasPerk, txt, head, icon, section, panel, div, h_flex, v_flex, opOf, colorOf, plates, actOf, ACT, STATUS, clip, stop } from "./kit.js";

export default class MapView {
  render(_cx) {
    const P = pal(), sps = spacesNow(), ags = agentsNow(), ov = props()?.overlay;
    const go = (fn) => () => { fn(); if (ov) closeOverlay(ov); };
    const zone = (sp, i) => {
      const grid = `${"ABCDEFGH"[i % 8]}${Math.floor(i / 8) + 1}`;
      const edge = sp.status ? colorOf(P, sp.status) : P.line;
      return v_flex().id(`zone-${sp.id}`).relative().w(300).flex_none().gap(8).p(12).bg(P.panel2).border_1().border_color(sp.active ? P.accent : edge)
        // contour lines: three inset outlines
        .child(div().absolute().left(10).top(10).right(10).bottom(10).border_1().border_color(P.line))
        .child(div().absolute().left(22).top(22).right(22).bottom(22).border_1().border_color(P.line).opacity(0.6))
        .child(h_flex().relative().gap(8).items_center().cursor_pointer().on_click(go(() => run("space.select", { id: sp.id })))
          .child(txt(grid, 12, P.accent, 800)).child(head(clip(sp.name, 18), 15, P.text).flex_1().min_w(0).truncate())
          .child(txt(sp.branch ? `⎇ ${clip(sp.branch, 12)}` : "", 11, P.dim, 700)))
        .children(sp.tabs.filter((t) => !t.settled || t.active).map((t) => {
          const here = ags.filter((a) => a.tab === t.id), c = t.status ? colorOf(P, t.status) : P.dim;
          return v_flex().id(`pin-${t.id}`).relative().gap(4).p(6).border_l_2().border_color(c)
            .child(h_flex().gap(7).items_center().cursor_pointer().hover((s) => s.bg(P.panel))
              .on_click(go(() => { if (!sp.active) run("space.select", { id: sp.id }); run("tab.select", { id: t.id }); }))
              .child(txt("⚑", 13, c, 800)).child(txt(clip(t.named ? t.name : `CONTRACT ${t.index}`, 28).toUpperCase(), 12, P.text, 800).flex_1().min_w(0).truncate()))
            .children(here.map((a) => {
              const o = opOf(a.address, a.program), act = actOf(a.address);
              return h_flex().id(`mp-${a.address}`).gap(7).items_center().pl(16).cursor_pointer().hover((s) => s.bg(P.panel))
                .on_click(go(() => run("agent.focus", { terminal: a.address })))
                .child(icon("op-helmet", 14, 14, colorOf(P, a.status))).child(head(o.call, 12, P.accent)).child(txt(clip(sessionOf(a).toUpperCase(), 18), 10, P.text, 700).flex_none())
                .child(txt(act ? ACT[act] : STATUS[a.status]?.word ?? "", 10, colorOf(P, a.status), 800).flex_1().min_w(0).truncate())
                .child(plates(P, a.status, 6, hasPerk(a.address, "quickfix") ? 1 : 0));
            }));
        }));
    };
    const legend = h_flex().gap(16).px(12).h(28).items_center().border_t_1().border_color(P.line)
      .children([["working", "ENGAGED"], ["blocked", "TAKING FIRE"], ["done", "CONTRACT CLEAR"], ["idle", "STANDING BY"]]
        .map(([s, w]) => h_flex().gap(6).items_center().child(div().size(8).bg(colorOf(P, s))).child(txt(w, 10, P.dim, 800))))
      .child(div().flex_1()).child(txt("CLICK A PIN OR OPERATOR TO JUMP · ESC TO CLOSE", 10, P.dim, 700));
    return div().id("map").size_full().on_mouse_down("left", stop).child(panel(P, section(P, "Operations map", `${sps.length} OPERATIONS · ${ags.length} OPERATORS`),
      div().id("map-body").flex_1().min_h(0).overflow_y_scrollbar().child(h_flex().flex_wrap().gap(12).p(14).children(sps.map(zone))), legend).size_full());
  }
}
