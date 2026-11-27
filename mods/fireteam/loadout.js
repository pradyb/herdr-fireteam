// Loadout screen (click the gear on a squad row, or LOADOUT on the operator card): pick this operator's
// weapon, camo and three perks. Choices are saved per terminal (shared "fireteam.loadout") and show up
// everywhere: the weapon silhouette and name, the camo colour on rows, headers and the card.
// Every perk changes how the HUD behaves; see its description and where kit.js hasPerk / focusedHas is read.

import { agentsNow } from "./kit.js";
import { agents, props, closeOverlay } from "herdr";
import { pal, txt, head, icon, section, panel, div, h_flex, v_flex, opOf, colorOf, STATUS, sessionOf, WEAPONS, CAMOS, PERKS, setLoadout, clip, stop } from "./kit.js";

export default class Loadout {
  render(_cx) {
    const P = pal(), addr = props()?.address, ov = props()?.overlay;
    const a = agentsNow().find((x) => x.address === addr);
    if (!a) return div().size_full().bg(P.panel).child(txt("OPERATOR NOT FOUND", 13, P.dim, 700).p(16));
    const o = opOf(a.address, a.program), c = colorOf(P, a.status), tint = o.camo ?? P.text;
    const pick = (patch) => () => setLoadout(addr, patch);
    const tile = (id, on, kids, fn, w = 118) => v_flex().id(id).w(w).flex_none().h(56).items_center().justify_center().gap(4).cursor_pointer()
      .border_1().border_color(on ? P.accent : P.line).bg(on ? P.panel2 : "#00000000").hover((s) => s.bg(P.panel2)).on_mouse_down("left", stop).on_click(fn).children(kids);

    const left = v_flex().w(300).flex_none().gap(10).p(14).border_r_1().border_color(P.line)
      .child(h_flex().gap(10).items_center().child(icon("op-helmet", 40, 40, c))
        .child(v_flex().gap(2).min_w(0).child(head(`[${o.unit}] ${o.call}`, 22, P.accent).truncate()).child(txt(`${o.role} · ${a.program?.name ?? ""}`, 12, P.dim, 700).truncate())))
      .child(txt(sessionOf(a) ? `SESSION · ${clip(sessionOf(a).toUpperCase(), 30)}` : "", 12, P.text, 800).truncate())
      .child(txt(STATUS[a.status]?.word ?? "", 12, c, 800))
      .child(div().h(110).flex().items_center().justify_center().bg(P.panel2).border_1().border_color(P.line).child(icon(o.gunIcon, 220, 80, tint)))
      .child(head(o.gun, 20, P.text))
      .child(txt(`CAMO · ${o.camoName}`, 12, o.camo ?? P.dim, 800))
      .child(v_flex().gap(4).children(o.perks.map((k, i) => {
        const p = PERKS[i].find((x) => x.k === k);
        return h_flex().gap(8).items_center().child(txt(`PERK ${i + 1}`, 10, P.dim, 800).w(44).flex_none()).child(txt(p ? p.n : "— EMPTY —", 12, p ? P.text : P.dim, 800));
      })))
      .child(div().flex_1())
      .child(h_flex().id("reset-loadout").h(28).items_center().justify_center().border_1().border_color(P.line).cursor_pointer().hover((s) => s.bg(P.panel2))
        .on_mouse_down("left", stop).on_click(() => setLoadout(addr, null)).child(txt("RESET TO ROLE DEFAULT", 11, P.text, 800)));

    const right = v_flex().id("loadout-body").flex_1().min_w(0).min_h(0).overflow_y_scrollbar().gap(14).p(14)
      .child(v_flex().gap(8).child(head("Weapon", 13, P.accent))
        .children(["ASSAULT", "SMG", "LMG", "SNIPER", "SHOTGUN", "PISTOL", "LAUNCHER"].map((cat) => h_flex().gap(8).items_center()
          .child(txt(cat, 10, P.dim, 800).w(70).flex_none())
          .children(WEAPONS.filter((w) => w.c === cat).map((w) => tile(`w-${w.n}`, w.n === o.gun,
            [icon(w.i, 64, 22, w.n === o.gun ? tint : P.dim), txt(w.n, 12, P.text, 800)], pick({ gun: w.n })))))))
      .child(v_flex().gap(8).child(head("Camo", 13, P.accent))
        .child(h_flex().flex_wrap().gap(8).children(CAMOS.map((k) => v_flex().id(`c-${k.n}`).w(86).flex_none().items_center().gap(5).cursor_pointer().on_mouse_down("left", stop).on_click(pick({ camo: k.n }))
          .child(div().w(54).h(34).bg(k.c ?? P.line).border_1().border_color(k.n === o.camoName ? "#ffffff" : P.line))
          .child(txt(k.n, 10, k.n === o.camoName ? P.text : P.dim, 800))))))
      .child(v_flex().gap(8).child(head("Perks", 13, P.accent))
        .child(h_flex().gap(10).children(PERKS.map((slot, i) => v_flex().flex_1().min_w(0).gap(6)
          .child(txt(`PERK ${i + 1}`, 10, P.dim, 800))
          .children(slot.map((p) => {
            const on = o.perks[i] === p.k, perks = [...o.perks];
            return v_flex().id(`p-${p.k}`).gap(2).p(8).cursor_pointer().border_1().border_color(on ? P.accent : P.line).bg(on ? P.panel2 : "#00000000")
              .hover((s) => s.bg(P.panel2)).on_mouse_down("left", stop)
              .on_click(() => { perks[i] = on ? null : p.k; setLoadout(addr, { perks }); })
              .child(txt(p.n, 12, on ? P.accent : P.text, 800)).child(txt(p.d, 10, P.dim, 700));
          }))))));
    return div().id("loadout").size_full().on_mouse_down("left", stop)
      .child(panel(P, section(P, "Loadout", "CLICK OUTSIDE OR ESC TO CLOSE"), h_flex().flex_1().min_h(0).items_stretch().child(left).child(right)).size_full());
  }
}
