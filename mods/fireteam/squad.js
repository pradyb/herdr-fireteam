// Left column: SQUAD (every agent as an operator: callsign, role, weapon, state word, five armour
// plates) and OPERATIONS (spaces) with their CONTRACTS (tabs). Click an operator or a contract to go there.

import { agentsNow, spacesNow } from "./kit.js";
import { agents, spaces, panes, props, run } from "herdr";
import { pal, ACT, actOf, sessionOf, openLoadout, hasPerk, txt, head, icon, section, panel, plates, div, h_flex, v_flex, opOf, colorOf, STATUS, clip, stop } from "./kit.js";

export default class Squad {
  operator(P, a) {
    const o = opOf(a.address, a.program), c = colorOf(P, a.status);
    return h_flex().id(`op-${a.address}`).relative().flex_none().h(62).px(10).gap(9).items_center().cursor_pointer()
      .bg(a.focused ? P.panel2 : "#00000000").hover((s) => s.bg(P.panel2)).tooltip(`${o.call} · ${o.role} · ${a.program?.name ?? ""} (click: go there)`)
      .on_click(() => run("agent.focus", { terminal: a.address }))
      .when(a.focused, (e) => e.child(div().absolute().left(0).top(0).bottom(0).w(2).bg(P.accent)))
      .when(Boolean(o.camo), (e) => e.child(div().absolute().left(3).top(8).bottom(8).w(2).bg(o.camo)))
      .child(icon(o.gunIcon, 38, 14, o.camo ?? c))
      .child(v_flex().flex_1().min_w(0).gap(2)
        .child(h_flex().gap(6).items_center()
          .child(txt(`[${o.unit}]`, 11, P.dim, 700).flex_none())
          .child(head(o.call, 14, a.focused ? P.accent : P.text).truncate()))
        .child(actOf(a.address) && a.status === "working" ? txt(ACT[actOf(a.address)], 11, P.good, 500).truncate() : txt(`${o.role} · ${o.gun}`, 11, P.dim, 500).truncate())
        .child(txt(sessionOf(a) ? `▸ ${clip(sessionOf(a).toUpperCase(), 26)}` : "", 11, P.text, 500).truncate()))
      .child(v_flex().flex_none().items_end().gap(4)
        .child(txt(STATUS[a.status]?.word ?? "", 11, c, 800))
        .child(plates(P, a.status, 9, hasPerk(a.address, "quickfix") ? 1 : 0)))
      .child(div().id(`ld-${a.address}`).w(20).h(20).flex_none().flex().items_center().justify_center().cursor_pointer().tooltip("Loadout: weapon, camo, perks")
        .hover((s) => s.bg(P.line)).on_mouse_down("left", stop).on_click(() => openLoadout(a.address)).child(txt("⚙", 14, P.dim, 800)));
  }

  render(_cx) {
    const P = pal(), ags = agentsNow(), sps = spacesNow();
    const dirOf = new Map(); // tab id -> folder name of its first terminal (focused one wins)
    if (!props()?.demo) for (const p of panes()) if (p.cwd && (p.focused || !dirOf.has(p.tab))) dirOf.set(p.tab, p.cwd.replace(/\/+$/, "").split("/").pop() || "~");
    const op = (sp) => {
      const sc = sp.status ? colorOf(P, sp.status) : P.dim;
      return v_flex().flex_none().pb(6)
        .child(h_flex().id(`sec-${sp.id}`).h(28).px(10).gap(8).items_center().cursor_pointer().hover((s) => s.bg(P.panel2))
          .on_click(() => run("space.select", { id: sp.id }))
          .child(div().size(7).flex_none().bg(sp.active ? P.accent : sc))
          .child(head(`${sp.index} · ${clip(sp.name, 24)}`, 13, sp.active ? P.accent : P.text).flex_1().min_w(0).truncate())
          .when(Boolean(sp.branch), (e) => e.child(txt(`⎇ ${clip(sp.branch, 10)}`, 11, P.dim, 700).flex_none()))
          .child(txt(`${sp.tabs.length}`, 12, P.dim, 700)))
        .children(sp.tabs.filter((t) => !t.settled || t.active).map((t) => {
          const on = sp.active && t.active, c = t.status ? colorOf(P, t.status) : P.dim;
          return h_flex().id(`ct-${t.id}`).h(24).pl(24).pr(10).gap(7).items_center().cursor_pointer()
            .bg(on ? P.panel2 : "#00000000").hover((s) => s.bg(P.panel2))
            .on_click(() => { if (!sp.active) run("space.select", { id: sp.id }); run("tab.select", { id: t.id }); })
            .child(div().w(4).h(4).flex_none().bg(c))
            .child(h_flex().flex_1().min_w(0).gap(6).items_center()
              .when(dirOf.has(t.id), (e) => e.child(txt(clip(dirOf.get(t.id), 14), 12, P.text, 700).flex_none()))
              .child(txt(clip(t.named ? t.name : `Contract ${t.index}`, 22), 12, P.dim, 500).min_w(0).truncate()))
            .when(t.status === "working" && t.working_since, (e) => e.child(txt(`${Math.max(1, Math.floor((Date.now() - t.working_since) / 60000))}m`, 11, P.good, 700)))
            .when(t.panes > 1, (e) => e.child(txt(`×${t.panes}`, 11, P.dim, 700)));
        }));
    };
    const btn = (id, label, fn) => h_flex().id(id).flex_1().h(26).items_center().justify_center().cursor_pointer().border_1().border_color(P.line)
      .hover((s) => s.bg(P.panel2)).on_mouse_down("left", stop).on_click(fn).child(txt(label, 12, P.text, 800));
    return v_flex().id("squad").size_full().gap(8).p(8).bg(P.bg)
      .child(panel(P, section(P, "Squad", `${ags.length}`), v_flex().id("squad-list").flex_1().min_h(0).overflow_y_scrollbar()
        .children(ags.length ? ags.map((a) => this.operator(P, a)) : [txt("NO OPERATORS DEPLOYED", 12, P.dim, 700).p(12)])).flex_1().min_h(0))
      .child(panel(P, section(P, "Operations", `${sps.length}`), v_flex().id("ops-list").flex_1().min_h(0).overflow_y_scrollbar().children(sps.map(op)),
        h_flex().flex_none().gap(6).p(8).child(btn("new-contract", "+ CONTRACT", () => run("tab.new", {}))).child(btn("new-op", "+ OPERATION", () => run("space.new", {})))).flex_1().min_h(0));
  }
}
