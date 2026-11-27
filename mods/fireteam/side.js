// Right column: RADAR, KILL FEED, SCORESTREAKS and the OPERATOR CARD. This block is also the
// brain of the HUD (one copy runs, polling every 1.2 s):
//  - Herdr status changes write the kill feed, the kill count and the streak charge;
//  - the Claude Code hook files (every tool call) give the finer events: a hit per successful edit or
//    command, damage per failed tool, contract accepted per prompt, range test, commit, push,
//    subagent drones. They become popups (popup.js), per-operator stats and a live "what is it doing".
// All of it lands in shared "fireteam.*" so the other blocks just read it.

import { S, agentsNow } from "./kit.js";
import { agents, props, run, shared, setShared, home, readTextFile, nextCommand, openOverlay, setWindowTitle } from "herdr";
import { dayKey, freshDay, todays, progress, newlyDone, medalsFor, DAILY_REWARD } from "./glory.js";
import { pal, txt, head, icon, section, panel, div, h_flex, v_flex, opOf, colorOf, STREAKS, ACT, statsOf, stop, clip, pad2, rankNow, hasPerk, focusedHas, needOf, sessionOf, sfx, openLoadout } from "./kit.js";

const R = 78; // radar radius
const DIR = () => `${home()}/.local/state/fireteam`;

export function openMap() {
  openOverlay({ mod: "fireteam", props: { role: "map" }, kind: "dialog", width: 0.82, height: 0.82 });
}

export function openDebrief() {
  openOverlay({ mod: "fireteam", props: { role: "debrief" }, kind: "dialog", width: 0.7, height: 0.5 });
}

export default class Side {
  init(_p, cx) {
    this.prev = null; this.seen = new Map(); this.busy = false; this.clears = [];
    if (props()?.demo) return; // demo: static data, never write the person's state
    cx.timer.every(1200, (cx) => this.poll(cx));
    this.poll(cx);
    cx.spawn(async () => { for (;;) { // ctrl-shift-m, ctrl-shift-o (KEYS.json)
      const c = await nextCommand();
      if (c === "map") openMap();
      else if (c === "debrief") openDebrief();
      else if (c === "loadout") { const f = agentsNow().find((x) => x.focused); if (f) openLoadout(f.address); }
    } });
  }

  async poll(cx) {
    if (this.busy) return;
    this.busy = true;
    try {
      const ags = agentsNow(), now = Date.now();
      let feed = [...(S("fireteam.feed") ?? [])], kills = Number(S("fireteam.kills") ?? 0), streak = Number(S("fireteam.streak") ?? 0);
      const acts = {}, stats = { ...(S("fireteam.stats") ?? {}) };
      let dirty = false, pop = null;
      let day = S("fireteam.day"), bonus = Number(S("fireteam.bonus") ?? 0);
      day = day && day.d === dayKey() ? { ...day, done: [...day.done] } : freshDay(dayKey());
      const tick = (k, n = 1) => { day[k] = (day[k] ?? 0) + n; };
      const line = (a, k, tgt) => { const o = opOf(a.address, a.program), ses = sessionOf(a); feed.push({ t: now, k, who: o.call, unit: o.unit, gun: o.gunIcon, tgt: k === "kill" || !ses ? tgt : `${tgt} · ${clip(ses.toUpperCase(), 18)}` }); dirty = true; };
      let snd = null;
      const P = (a, kind, text, pts) => {
        if (hasPerk(a.address, "deadsilence")) return;
        pop = { t: now, kind, text, pts: hasPerk(a.address, "overkill") ? pts * 2 : pts, who: `${opOf(a.address, a.program).call}${sessionOf(a) ? ` · ${clip(sessionOf(a).toUpperCase(), 20)}` : ""}` };
        snd = kind === "info" ? (snd ?? "info") : kind === "dmg" ? (snd === "kill" ? snd : "dmg") : kind === "kill" ? "kill" : (snd === "kill" || snd === "dmg" ? snd : "hit");
      };
      const bump = (addr, f, n = 1) => { stats[addr] = { ...statsOf(addr), ...stats[addr] }; stats[addr][f] = (stats[addr][f] ?? 0) + n; dirty = true; };

      // 1. Herdr status changes
      const cur = new Map(ags.map((a) => [a.address, a]));
      if (this.prev) {
        for (const a of ags) {
          const p = this.prev.get(a.address), tab = (a.tab_name || a.title || "contract").toUpperCase();
          if (!p) line(a, "info", "DEPLOYED");
          else if (p.status !== a.status) {
            if (p.status === "working" && (a.status === "done" || a.status === "idle")) {
              line(a, "kill", clip(tab, 22)); kills++; streak = Math.min(20, streak + (hasPerk(a.address, "scavenger") ? 2 : 1));
              const hs = this.seen.get(a.address), medals = medalsFor({ prior: this.clears, now, errTache: hs?.tache ? (hs.errTache ?? 0) : null, worked: (hs?.coups ?? 0) > 0, firstOfDay: day.clears === 0 });
              this.clears = [...this.clears.filter((t) => now - t <= 60000), now];
              tick("clears"); tick("medals", medals.length); if (medals.includes("FLAWLESS")) tick("flawless");
              for (const m of medals) line(a, "warn", `★ ${m}`);
              P(a, "kill", medals.length ? medals.slice(0, 2).join(" · ") : "CONTRACT CLEAR", 100);
            }
            else if (a.status === "blocked") { line(a, "warn", "NEEDS BACKUP"); P(a, "dmg", "NEEDS BACKUP", 0); }
            else if (a.status === "working") line(a, "info", "ENGAGED");
          }
        }
        for (const [k, p] of this.prev) if (!cur.has(k)) line(p, "info", "EXTRACTED");
      }
      this.prev = cur;

      // 2. hook files: what each operator is doing, and the events between two looks
      for (const a of ags) {
        let s = null;
        try { s = JSON.parse((await readTextFile(`${DIR()}/${a.address}.json`)) ?? "null"); } catch { s = null; }
        const old = this.seen.get(a.address);
        this.seen.set(a.address, s);
        if (s && a.status === "working" && s.act && s.act !== "fini") acts[a.address] = { act: s.act, tool: s.outil ?? "" };
        if (!s || !old) continue; // first look: a baseline, not an event
        const newTask = s.tache !== old.tache, base = newTask ? 0 : old.coups ?? 0;
        if (newTask) P(a, "info", "CONTRACT ACCEPTED", 0);
        if ((s.coups ?? 0) > base) { const n = s.coups - base; bump(a.address, "hits", n); P(a, "hit", s.outil === "Bash" ? "COMMAND RUN" : "DIRECT HIT", 10 * n); }
        if ((s.errT ?? 0) > (old.errT ?? 0) && !hasPerk(a.address, "coldblooded")) { bump(a.address, "errs"); P(a, "dmg", "DAMAGE TAKEN", 0); } // COLD-BLOODED shrugs it off
        if (old.act === "medite" && s.act !== "medite" && hasPerk(a.address, "fasthands")) P(a, "kill", "RELOADED", 25); // FAST HANDS
        if ((s.essai?.t ?? 0) > (old.essai?.t ?? 0) && s.essai.ok) tick("tests");
        if ((s.essai?.t ?? 0) > (old.essai?.t ?? 0) && (s.essai.ok || !hasPerk(a.address, "coldblooded"))) P(a, s.essai.ok ? "kill" : "dmg", s.essai.ok ? "RANGE CLEAR" : "TARGETS MISSED", s.essai.ok ? 50 : 0);
        if ((s.commitT ?? 0) > (old.commitT ?? 0)) { tick("commits"); P(a, "kill", "INTEL SECURED", 50); line(a, "info", "COMMIT LOCKED IN"); }
        if ((s.pushT ?? 0) > (old.pushT ?? 0)) { tick("pushes"); P(a, "kill", "EXFIL CONFIRMED", 75); line(a, "info", "PUSHED: EXTRACTION"); }
        if ((s.subs ?? 0) > (old.subs ?? 0)) { tick("drones"); bump(a.address, "subs"); P(a, "info", "DRONE DEPLOYED", 25); }
        if (s.act === "eclaire" && old.act !== "eclaire") bump(a.address, "reads");
      }

      // daily challenges reached this poll: reward, feed line, popup
      for (const ch of newlyDone(day)) {
        day.done.push(ch.k); bonus += DAILY_REWARD; dirty = true; snd = "ready";
        feed.push({ t: now, k: "warn", who: "COMMAND", unit: "HQ", gun: "", tgt: `CHALLENGE DONE · ${ch.n}` });
        pop = { t: now, kind: "kill", text: "CHALLENGE COMPLETE", pts: DAILY_REWARD * 25, who: ch.n };
      }
      if (JSON.stringify(day) !== JSON.stringify(S("fireteam.day"))) setShared("fireteam.day", day);
      if (bonus !== Number(S("fireteam.bonus") ?? 0)) setShared("fireteam.bonus", bonus);

      // 3. publish only what changed
      if (JSON.stringify(acts) !== JSON.stringify(S("fireteam.act") ?? {})) { setShared("fireteam.act", acts); dirty = true; }
      if (dirty) { setShared("fireteam.feed", feed.slice(-30)); setShared("fireteam.stats", stats); }
      if (kills !== Number(S("fireteam.kills") ?? 0)) setShared("fireteam.kills", kills);
      if (pop) setShared("fireteam.pop", pop);
      if (STREAKS.some((s) => streak >= needOf(s, ags) && Number(S("fireteam.streak") ?? 0) < needOf(s, ags))) snd = "ready";
      if (snd) sfx(snd);
      if (streak !== Number(S("fireteam.streak") ?? 0)) setShared("fireteam.streak", streak);
      const fa = ags.find((a) => a.focused);
      setWindowTitle(fa && sessionOf(fa) ? `${sessionOf(fa)} · FIRETEAM` : null);
      cx.notify();
    } finally { this.busy = false; }
  }

  radar(P, ags) {
    const D = R * 2, ring = (r) => div().absolute().left(R - r).top(R - r).size(r * 2).rounded_full().border_1().border_color(P.line);
    const el = div().relative().flex_none().w(D).h(D).rounded_full().bg(P.panel2).overflow_hidden()
      .child(ring(R - 1)).child(ring(R * 0.66)).child(ring(R * 0.33))
      .child(div().absolute().left(R).top(0).w(1).h(D).bg(P.line)).child(div().absolute().left(0).top(R).w(D).h(1).bg(P.line))
      .child(icon("sweep", D, D, P.good).absolute().left(0).top(0).spin(4200))
      .child(div().absolute().left(R - 6).top(R - 8).w(12).flex().justify_center().child(txt("▲", 12, P.text, 800)));
    for (const a of ags) {
      const ghost = hasPerk(a.address, "ghost");
      if (ghost && !focusedHas(ags, "tracker")) continue; // GHOST hides, unless a TRACKER is in the squad
      const o = opOf(a.address, a.program), th = (o.bearing - 90) * Math.PI / 180, r = o.ring * (R - 8);
      let b = div().id(`blip-${a.address}`).absolute().left(R + r * Math.cos(th) - 5).top(R + r * Math.sin(th) - 5).size(10).rounded_full()
        .bg(colorOf(P, a.status)).opacity(ghost ? 0.4 : 1).border_1().border_color(a.focused ? P.text : "#00000000").cursor_pointer()
        .tooltip(`${o.call} · ${sessionOf(a)} · ${a.status}`).on_mouse_down("left", stop).on_click(() => run("agent.focus", { terminal: a.address }));
      if (a.status === "blocked") b = b.loop("opacity", { from: 0.2, to: 1, period: 480 });
      el.child(b);
    }
    return el;
  }

  feed(P) {
    const rows = [...(S("fireteam.feed") ?? [])].reverse().slice(0, 8);
    const col = { kill: P.text, warn: P.warn, info: P.dim };
    return v_flex().flex_1().min_h(0).overflow_hidden().p(8).gap(5).children(rows.length ? rows.map((e, i) => {
      const d = new Date(e.t);
      return h_flex().gap(6).items_center().opacity(1 - i * 0.09)
        .child(txt(`${pad2(d.getHours())}:${pad2(d.getMinutes())}`, 10, P.dim, 700).flex_none())
        .child(txt(`[${e.unit}]`, 11, P.dim, 700).flex_none())
        .child(txt(e.who, 13, e.k === "kill" ? P.accent : col[e.k], 800).flex_none())
        .when(e.k === "kill" && e.gun, (el) => el.child(icon(e.gun, 26, 9, P.text)))
        .child(txt(e.tgt, 12, e.k === "kill" ? P.bad : col[e.k], 800).min_w(0).truncate());
    }) : [txt("QUIET ON THE NET", 12, P.dim, 700)]);
  }

  /** Today's three challenges, a segmented bar each. Progress is counted by poll(). */
  challenges(P) {
    const key = dayKey(), saved = S("fireteam.day"), day = saved && saved.d === key ? saved : freshDay(key), list = todays(key);
    return panel(P, section(P, "Challenges", `${list.filter((c) => day.done.includes(c.k)).length}/3`), v_flex().p(10).gap(8).children(list.map((ch) => {
      const done = day.done.includes(ch.k), have = progress(day, ch);
      return v_flex().id(`ch-${ch.k}`).gap(3).tooltip(`Daily challenge: +${DAILY_REWARD * 25} XP when done. Resets at midnight.`)
        .child(h_flex().gap(8).items_center().child(txt(ch.n, 11, done ? P.good : P.text, 800).flex_1().min_w(0).truncate()).child(txt(done ? "DONE" : `${have}/${ch.need}`, 11, done ? P.good : P.dim, 800)))
        .child(h_flex().gap(2).children(Array.from({ length: ch.need }, (_, i) => div().flex_1().h(3).bg(i < have ? (done ? P.good : P.accent) : P.line))));
    }))).flex_none();
  }

  streaks(P, ags) {
    const have = Number(S("fireteam.streak") ?? 0);
    const call = (s) => {
      sfx(`ss-${s.key}`);
      setShared("fireteam.streak", have - needOf(s, ags));
      setShared("fireteam.feed", [...(S("fireteam.feed") ?? []), { t: Date.now(), k: "warn", who: "COMMAND", unit: "HQ", gun: "", tgt: `${s.name} ONLINE` }].slice(-30));
      setShared("fireteam.pop", { t: Date.now(), kind: "info", text: `${s.name} ONLINE`, pts: 0, who: "HQ" });
      const by = (st) => ags.find((a) => a.status === st);
      if (s.key === "uav") { const a = by("blocked") ?? by("working"); if (a) run("agent.focus", { terminal: a.address }); }
      else if (s.key === "cruise") { const a = by("done"); if (a) run("agent.focus", { terminal: a.address }); }
      else if (s.key === "gunship") run("pane.zoom", {});
      else run("tab.new", {});
    };
    return h_flex().flex_none().p(8).gap(6).children(STREAKS.map((s) => {
      const need = needOf(s, ags), ready = have >= need;
      let t = v_flex().id(`ss-${s.key}`).flex_1().h(54).items_center().justify_center().gap(3).border_1().border_color(ready ? P.accent : P.line)
        .bg(ready ? P.panel2 : "#00000000").tooltip(`${s.tip} (${ready ? "READY: click" : `${have}/${need} contracts`})`)
        .on_mouse_down("left", stop)
        .child(icon(s.icon, 20, 20, ready ? P.accent : P.dim))
        .child(txt(s.name, 10, ready ? P.accent : P.dim, 800))
        .child(div().w(34).h(3).bg(P.line).child(div().w(Math.round(34 * Math.min(1, have / need))).h(3).bg(ready ? P.accent : P.dim)));
      if (ready) t = t.cursor_pointer().on_click(() => call(s)).loop("opacity", { from: 0.7, to: 1, period: 900 });
      return t;
    }));
  }

  /** The focused operator as a loadout card: weapon, live action, and stats earned from real tool calls. */
  card(P, cur) {
    if (!cur) return v_flex().p(12).child(txt("NO OPERATOR SELECTED", 12, P.dim, 700));
    const o = opOf(cur.address, cur.program), st = statsOf(cur.address), shots = st.hits + st.errs;
    const acc = shots ? Math.round((100 * st.hits) / shots) : null;
    const act = S("fireteam.act")?.[cur.address];
    const bar = (label, frac, val) => h_flex().gap(8).items_center()
      .child(txt(label, 10, P.dim, 800).w(62).flex_none())
      .child(div().flex_1().h(4).bg(P.line).child(div().h(4).w(Math.round(110 * Math.max(0, Math.min(1, frac)))).bg(P.accent)))
      .child(txt(val, 11, P.text, 800).w(30).flex_none().flex().justify_end());
    return v_flex().p(10).gap(7)
      .child(h_flex().gap(8).items_center()
        .child(icon("op-helmet", 20, 20, colorOf(P, cur.status)))
        .child(v_flex().flex_1().min_w(0).gap(1).child(head(`[${o.unit}] ${o.call}`, 14, P.accent).truncate()).child(txt(`${o.role} · ${cur.program?.name ?? ""}`, 11, P.dim, 700).truncate()))
        .child(icon(o.gunIcon, 56, 20, o.camo ?? P.text)))
      .child(txt(sessionOf(cur) ? `SESSION · ${clip(sessionOf(cur).toUpperCase(), 28)}` : "", 11, P.text, 800).truncate())
      .child(txt(act ? `${ACT[act.act] ?? act.act.toUpperCase()}${act.tool ? ` · ${act.tool}` : ""}` : cur.status === "blocked" ? "AWAITING ORDERS" : "STANDING BY", 11, act ? P.good : P.dim, 800))
      .child(bar("DAMAGE", st.hits / 60, String(st.hits)))
      .child(bar("ACCURACY", (acc ?? 0) / 100, acc == null ? "--" : `${acc}%`))
      .child(bar("RECON", st.reads / 40, String(st.reads)))
      .child(bar("DRONES", st.subs / 10, String(st.subs)))
      .child(h_flex().id("loadout-btn").h(26).items_center().justify_center().gap(6).border_1().border_color(P.accent).cursor_pointer().hover((s) => s.bg(P.panel2))
        .on_mouse_down("left", stop).on_click(() => openLoadout(cur.address)).child(txt(`LOADOUT · ${o.gun}${o.camoName !== "STANDARD" ? ` · ${o.camoName}` : ""}`, 11, P.accent, 800).truncate()));
  }

  render(_cx) {
    const P = pal(), ags = agentsNow();
    const eng = ags.filter((a) => a.status === "working").length, cur = ags.find((a) => a.focused);
    return v_flex().id("side").size_full().gap(8).p(8).bg(P.bg)
      .child(panel(P, section(P, "Radar", `${pad2(eng)}/${pad2(ags.length)} ENGAGED`), div().flex().justify_center().py(8).child(this.radar(P, ags))).flex_none())
      .child(panel(P, section(P, "Kill feed"), this.feed(P)).flex_1().min_h(0))
      .child(this.challenges(P))
      .child(panel(P, section(P, "Scorestreaks", `${Number(S("fireteam.streak") ?? 0)} PTS`), this.streaks(P, ags)).flex_none())
      .child(panel(P, section(P, "Operator", rankNow().name), this.card(P, cur)).flex_none());
  }
}
