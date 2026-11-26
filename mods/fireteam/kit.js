// Fireteam: shared bits. Palette packs (the "camo"), operator identity, text and panel helpers.
// Nothing here is game art: flat panels, thin lines, one accent colour, stencil caps.

import { div, svg } from "gpui-kit";
import { h_flex, v_flex } from "gpui-base";
import { shared, setShared, playSound, openOverlay, props, agents, spaces } from "herdr";
import { DEMO } from "./demo.js";

export const HEAD = "Saira Stencil One"; // stencil caps, headings only (fonts/, OFL)
export const UI = "Rajdhani"; // squared HUD sans (fonts/, OFL)
export const ART = "mods/fireteam/art";

// ------------------------------------------------------------------ packs (customise: click the swatches, bottom bar)
// ponytail: five fixed packs; a user pack would be one more object here (or read from settings).
export const PACKS = [
  { name: "MODERN", bg: "#090b0a", panel: "#101311ee", panel2: "#161a17", line: "#ffffff1c", text: "#ece9de", dim: "#8c9087", accent: "#f2a516", good: "#63d06a", bad: "#ff4a3d", warn: "#f2c230", idle: "#7d8a91" },
  { name: "NVG", bg: "#020a04", panel: "#04110aee", panel2: "#061a0e", line: "#39ff6a33", text: "#b9ffc4", dim: "#4f9a62", accent: "#39ff6a", good: "#39ff6a", bad: "#ff6a5a", warn: "#d8ff5a", idle: "#3f8a55" },
  { name: "ARCTIC", bg: "#080d12", panel: "#0d151cee", panel2: "#121d27", line: "#9fdcff26", text: "#e6f3fb", dim: "#7e96a6", accent: "#5cc8ff", good: "#5fe0b0", bad: "#ff5d6c", warn: "#ffd166", idle: "#7f93a3" },
  { name: "ZOMBIES", bg: "#0a0610", panel: "#120b1aee", panel2: "#1a1125", line: "#b26bff2e", text: "#ece3f7", dim: "#8e7aa6", accent: "#a8ff3c", good: "#a8ff3c", bad: "#ff4a6e", warn: "#ffb23c", idle: "#8a7aa0" },
  { name: "HAZARD", bg: "#0b0b0b", panel: "#131313ee", panel2: "#1b1b1b", line: "#ffffff22", text: "#f2f2f2", dim: "#8d8d8d", accent: "#ffd400", good: "#7ee26b", bad: "#ff4040", warn: "#ffd400", idle: "#8d8d8d" },
];
/** Shared state, or the demo's when this block has props.demo (screenshots). */
export const S = (key) => (props()?.demo ? DEMO.shared[key] : shared(key));
export const agentsNow = () => (props()?.demo ? DEMO.agents : agents());
export const spacesNow = () => (props()?.demo ? DEMO.spaces : spaces());
export const pal = () => PACKS[Number(S("fireteam.pack") ?? 0) % PACKS.length];

// ------------------------------------------------------------------ small helpers
export function hash(s) {
  let h = 2166136261;
  for (const ch of String(s)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  h ^= h >>> 16; h = Math.imul(h, 0x7feb352d); h ^= h >>> 15; h = Math.imul(h, 0x846ca68b); h ^= h >>> 16;
  return h >>> 0;
}
export const clip = (s, n) => { s = String(s ?? ""); return s.length > n ? s.slice(0, Math.max(1, n - 1)) + "…" : s; };
export const pad2 = (n) => String(n).padStart(2, "0");
export const zulu = (d) => `${pad2(d.getHours())}${pad2(d.getMinutes())}Z`;
export const stop = (_e, cx) => cx.stop_propagation();

export const txt = (s, size = 13, color = "#fff", weight = 600) =>
  div().font_family(UI).font_weight(weight).text_size(size).text_color(color).line_height(1.1).child(String(s ?? ""));
export const head = (s, size = 14, color = "#fff") =>
  div().font_family(HEAD).font_weight(400).text_size(size).text_color(color).line_height(1.05).child(String(s ?? "").toUpperCase());
export const icon = (name, w, h, color) => svg(`${ART}/${name}.svg`).w(w).h(h).flex_none().text_color(color);

/** Section header: accent tick, stencil title, hairline, optional right text. */
export function section(P, title, right) {
  return h_flex().flex_none().h(24).items_center().gap(7).px(10).border_b_1().border_color(P.line)
    .child(div().w(3).h(11).flex_none().bg(P.accent))
    .child(head(title, 13, P.text).flex_1())
    .when(Boolean(right), (e) => e.child(txt(right, 12, P.dim, 700)));
}

/** A flat HUD panel with accent corner ticks (top-left, bottom-right). */
export function panel(P, ...kids) {
  return div().relative().flex().flex_col().bg(P.panel).border_1().border_color(P.line)
    .child(div().absolute().left(-1).top(-1).w(10).h(2).bg(P.accent))
    .child(div().absolute().left(-1).top(-1).w(2).h(10).bg(P.accent))
    .child(div().absolute().right(-1).bottom(-1).w(10).h(2).bg(P.accent))
    .child(div().absolute().right(-1).bottom(-1).w(2).h(10).bg(P.accent))
    .children(kids);
}

// ------------------------------------------------------------------ operators
const CALLSIGNS = ["Ember", "Specter", "Halo", "Nomad", "Sable", "Wraith", "Cipher", "Reaper", "Havoc", "Gravel", "Ironside", "Vandal",
  "Bulwark", "Maverick", "Colt", "Dutch", "Mercer", "Tango", "Hawkeye", "Ghost", "Shade", "Revenant", "Phantom", "Omen", "Bear", "Volk", "Anvil", "Sarge"];
const UNITS = ["TF", "SC", "RG", "GH", "SP"]; // Task Force, Shadow Co., Rangers, Ghosts, Spetsnaz
// role by program; weapon = [name, silhouette]
const ROLES = {
  recon: { name: "RECON", gun: ["M4A1", "gun-ar"], tint: "accent" },
  gunsmith: { name: "GUNSMITH", gun: ["MP7", "gun-smg"], tint: "warn" },
  medic: { name: "MEDIC", gun: ["SA87", "gun-lmg"], tint: "good" },
  marksman: { name: "MARKSMAN", gun: ["DRAGUNOV", "gun-sniper"], tint: "accent" },
  operator: { name: "OPERATOR", gun: ["1911", "gun-pistol"], tint: "text" },
  sentry: { name: "SENTRY", gun: ["MODEL 680", "gun-shotgun"], tint: "dim" },
};
export function roleOf(program) {
  const k = String(program?.key ?? "").toLowerCase();
  if (k.startsWith("claude")) return "recon";
  if (k === "codex") return "gunsmith";
  if (program?.shell || k === "shell") return "sentry";
  if (k.includes("gemini")) return "medic";
  if (k.includes("opencode") || k === "pi" || k.includes("amp") || k.includes("cursor")) return "marksman";
  return "operator";
}
/** Everything that makes a terminal an operator, stable for its address, plus its loadout (weapon, camo, perks). */
export function opOf(address, program) {
  const h = hash(address), role = roleOf(program), R = ROLES[role], L = S("fireteam.loadout")?.[address];
  const W = WEAPONS.find((w) => w.n === L?.gun);
  return { address, role: R.name, gun: W ? W.n : R.gun[0], gunIcon: W ? W.i : R.gun[1], camo: CAMOS.find((c) => c.n === L?.camo)?.c ?? null,
    camoName: L?.camo ?? "STANDARD", perks: L?.perks ?? [null, null, null], tint: R.tint, call: CALLSIGNS[h % CALLSIGNS.length],
    unit: UNITS[(h >>> 7) % UNITS.length], bearing: (h >>> 3) % 360, ring: 0.25 + ((h >>> 11) % 100) / 133, prog: program?.name ?? "agent" };
}
export const STATUS = {
  working: { word: "ENGAGED", color: "good", plates: 4 },
  blocked: { word: "TAKING FIRE", color: "bad", plates: 1 },
  done: { word: "CONTRACT CLEAR", color: "warn", plates: 5 },
  idle: { word: "STANDING BY", color: "idle", plates: 3 },
};
export const colorOf = (P, st) => P[STATUS[st]?.color ?? "idle"];

/** Five armour plates, filled by state. */
export function plates(P, st, w = 12, extra = 0) {
  const n = Math.min(5, (STATUS[st]?.plates ?? 3) + extra), c = colorOf(P, st); // extra: Quick Fix
  return h_flex().gap(2).flex_none().children([0, 1, 2, 3, 4].map((i) => {
    const el = div().w(w).h(5).bg(i < n ? c : P.line);
    return st === "blocked" && i === 0 ? el.loop("opacity", { from: 0.3, to: 1, period: 500 }) : st === "working" && i === n - 1 ? el.loop("opacity", { from: 0.35, to: 1, period: 800 }) : el;
  }));
}

export const RANKS = ["PVT", "PFC", "CPL", "SGT", "SSG", "LT", "CPT", "MAJ", "COL", "GEN"];
/** Rank from completed contracts: one rank per 4. */
export function rankOf(kills) {
  const lv = Math.min(RANKS.length - 1, Math.floor(kills / 4));
  return { lv, name: RANKS[lv], into: kills % 4, of: 4, max: lv === RANKS.length - 1 };
}
export const STREAKS = [
  { key: "uav", name: "UAV", need: 3, icon: "ss-uav", tip: "UAV: jump to the operator under fire" },
  { key: "cruise", name: "CRUISE", need: 5, icon: "ss-cruise", tip: "Cruise Missile: jump to a finished contract" },
  { key: "gunship", name: "GUNSHIP", need: 7, icon: "ss-gunship", tip: "Gunship: zoom the focused terminal" },
  { key: "jugg", name: "JUGG", need: 9, icon: "ss-jugg", tip: "Juggernaut: deploy a new terminal" },
];
export { div, h_flex, v_flex };

// ------------------------------------------------------------------ live activity (from the Claude Code hook)
// The hook (hooks/fireteam-activity.py, installed by tools/install.sh --hook) writes
// ~/.local/state/fireteam/<terminal>.json on every tool call. side.js polls it into shared "fireteam.*".
export const ACT = { pense: "ANALYSING", eclaire: "RECON", code: "FIRING", commande: "EXECUTING", test: "RANGE TEST", web: "COMMS UPLINK", medite: "RELOADING" };
export const actOf = (addr) => S("fireteam.act")?.[addr]?.act ?? null;
export const statsOf = (addr) => ({ hits: 0, errs: 0, reads: 0, subs: 0, ...(S("fireteam.stats")?.[addr] ?? {}) });

// ------------------------------------------------------------------ loadout: weapon, camo, perks (chosen in loadout.js)
export const WEAPONS = [
  { n: "M4A1", i: "gun-ar", c: "ASSAULT" }, { n: "AK-47", i: "gun-ar", c: "ASSAULT" }, { n: "FR 556", i: "gun-ar", c: "ASSAULT" },
  { n: "MP7", i: "gun-smg", c: "SMG" }, { n: "SA87", i: "gun-lmg", c: "LMG" }, { n: "DRAGUNOV", i: "gun-sniper", c: "MARKSMAN" },
  { n: "MODEL 680", i: "gun-shotgun", c: "SHOTGUN" }, { n: "1911", i: "gun-pistol", c: "PISTOL" }, { n: "RPG-7", i: "gun-launcher", c: "LAUNCHER" },
];
export const CAMOS = [
  { n: "STANDARD", c: null }, { n: "WOODLAND", c: "#7aa843" }, { n: "DESERT", c: "#d9b36a" }, { n: "ARCTIC", c: "#bfe6ff" },
  { n: "DIGITAL", c: "#7f95c8" }, { n: "TIGER", c: "#f08a24" }, { n: "GOLD", c: "#ffd34d" }, { n: "DARK MATTER", c: "#b26bff" },
];
// three slots. Every perk really changes the HUD (see the [fx] text, and where each is read).
export const PERKS = [
  [{ k: "ghost", n: "GHOST", d: "[fx] Hidden from the radar and the compass" }, { k: "coldblooded", n: "COLD-BLOODED", d: "[fx] Failed tools do no damage: no popup or sound, and no hit on accuracy" }, { k: "quickfix", n: "QUICK FIX", d: "[fx] +1 armour plate on this operator's rows" }],
  [{ k: "scavenger", n: "SCAVENGER", d: "[fx] Each finished contract charges scorestreaks +1 extra" }, { k: "overkill", n: "OVERKILL", d: "[fx] XP popups are worth double" }, { k: "fasthands", n: "FAST HANDS", d: "[fx] RELOADED popup (+25 XP) when a context compaction ends" }],
  [{ k: "tracker", n: "TRACKER", d: "[fx] While this operator is focused: Ghost operators show on the radar and compass" }, { k: "deadsilence", n: "DEAD SILENCE", d: "[fx] Mutes this operator's popups and sounds" }, { k: "hardline", n: "HARDLINE", d: "[fx] While this operator is focused: scorestreaks cost 1 contract less" }],
];
export const hasPerk = (addr, k) => (S("fireteam.loadout")?.[addr]?.perks ?? []).includes(k);
/** Perks that shape the view (Tracker, Hardline): read from the focused operator, whose HUD this is. */
export const focusedHas = (ags, k) => hasPerk(ags.find((a) => a.focused)?.address, k);
/** A scorestreak's cost, 1 less while the focused operator has Hardline. */
export const needOf = (s, ags) => Math.max(1, s.need - (focusedHas(ags, "hardline") ? 1 : 0));
export function setLoadout(addr, patch) {
  const all = { ...(S("fireteam.loadout") ?? {}) };
  if (patch === null) delete all[addr]; else all[addr] = { ...(all[addr] ?? {}), ...patch };
  setShared("fireteam.loadout", all);
}
export const openLoadout = (address) => openOverlay({ mod: "fireteam", props: { role: "loadout", address }, kind: "dialog", width: 0.74, height: 0.8 });

// ------------------------------------------------------------------ session name and sound
/** The terminal's session name (what you see in the agent's own title), without its leading status glyph. */
export const sessionOf = (a) => String(a?.pane_name || a?.title || a?.tab_name || "").replace(/^[^\p{L}\p{N}]+/u, "").trim();
let lastSfx = 0;
/** hit | kill | dmg | ready | info. Muted by shared "fireteam.mute"; ticks are rate-limited. */
export function sfx(name) {
  if (S("fireteam.mute")) return;
  const now = Date.now();
  if (name === "hit" && now - lastSfx < 350) return;
  lastSfx = now;
  playSound(`mods/fireteam/sounds/${name}.mp3`);
}
