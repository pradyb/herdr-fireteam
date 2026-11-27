// Debrief (ctrl-shift-d, or DEBRIEF in the bottom bar): the match-results screen. Totals on top, then
// one row per operator with the stats the hook records. MVP = most damage (successful edits and commands).
// Click outside (or Esc) to close.

import { setShared } from "herdr";
import { agentsNow, S, statsOf, rankNow } from "./kit.js";
import { pal, txt, head, section, panel, div, h_flex, v_flex, opOf, colorOf, stop } from "./kit.js";

const COLS = [["OPERATOR", 0], ["DAMAGE", 90], ["ACCURACY", 100], ["RECON", 90], ["DRONES", 90]];

export default class Debrief {
  arm = false; // RESET RANK needs a second click
  render(cx) {
    const P = pal(), kills = Number(S("fireteam.kills") ?? 0), rk = rankNow();
    const rows = agentsNow().map((a) => {
      const st = statsOf(a.address), shots = st.hits + st.errs;
      return { a, o: opOf(a.address, a.program), st, acc: shots ? Math.round((100 * st.hits) / shots) : null };
    }).sort((x, y) => y.st.hits - x.st.hits);
    const mvp = rows[0] && rows[0].st.hits > 0 ? rows[0].a.address : null;
    const tile = (label, val, sub) => v_flex().flex_1().gap(2).p(12).bg(P.panel2).border_1().border_color(P.line)
      .child(txt(label, 10, P.dim, 800)).child(head(val, 24, P.accent)).child(txt(sub, 10, P.dim, 700));
    const cell = (s, w, c = P.text) => (w ? txt(s, 13, c, 800).w(w).flex_none() : txt(s, 13, c, 800).flex_1().min_w(0).truncate());
    const row = ({ a, o, st, acc }) => h_flex().gap(10).px(12).h(38).items_center().border_b_1().border_color(P.line)
      .child(cell(`[${o.unit}] ${o.call}${a.address === mvp ? "  ★ MVP" : ""}  ·  ${o.role}`, 0, a.address === mvp ? P.accent : colorOf(P, a.status)))
      .child(cell(String(st.hits), 90)).child(cell(acc == null ? "--" : `${acc}%`, 100)).child(cell(String(st.reads), 90)).child(cell(String(st.subs), 90));
    return div().id("debrief").size_full().on_mouse_down("left", stop).child(panel(P, section(P, "Debrief", rk.name),
      v_flex().flex_1().min_h(0).gap(12).p(14)
        .child(h_flex().gap(10)
          .child(tile("CONTRACTS CLEARED", String(kills), "FINISHED AGENT RUNS"))
          .child(tile("RANK", rk.name, rk.max ? "MAX RANK" : `${rk.into}/${rk.of} CONTRACTS`))
          .child(tile("SCORESTREAK POINTS", String(Number(S("fireteam.streak") ?? 0)), "UAV 3 · CRUISE 5 · GUNSHIP 7 · JUGG 9"))
          .child(tile("OPERATORS", String(rows.length), `${rows.filter((r) => r.a.status === "working").length} ENGAGED`)))
        .child(h_flex().gap(10).px(12).h(24).items_center().children(COLS.map(([l, w]) => (w ? txt(l, 10, P.dim, 800).w(w).flex_none() : txt(l, 10, P.dim, 800).flex_1()))))
        .child(div().id("debrief-body").flex_1().min_h(0).overflow_y_scrollbar().children(rows.length ? rows.map(row) : [txt("NO OPERATORS DEPLOYED", 12, P.dim, 700)]))
        .child(h_flex().gap(10).items_center()
          .child(txt("STATS COME FROM THE AGENT HOOK · ESC TO CLOSE", 10, P.dim, 700).flex_1())
          .child(h_flex().id("reset-rank").px(10).h(24).items_center().border_1().border_color(this.arm ? P.bad : P.line).cursor_pointer().hover((s) => s.bg(P.panel2))
            .on_mouse_down("left", stop)
            .on_click(() => { if (this.arm) { setShared("fireteam.kills", 0); setShared("fireteam.bonus", 0); this.arm = false; } else this.arm = true; cx.notify(); })
            .child(txt(this.arm ? "CLICK AGAIN: RANK BACK TO PVT" : "RESET RANK", 10, this.arm ? P.bad : P.dim, 800))))).size_full());
  }
}
