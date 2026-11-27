// Medals and daily challenges. Pure logic (no Herdr imports) so tools/test_glory.mjs can check it with node.
// side.js feeds it events and shows the results; the state lives in shared "fireteam.day".

export const DAILY_REWARD = 2; // each completed challenge is worth 2 contract credits (50 XP) of rank progress

// Every challenge counts one field of the day record. "clears" works for any agent (no hook needed), so it is always one of the three.
export const POOL = [
  { k: "clears", n: "CLEAR 5 CONTRACTS", need: 5 },
  { k: "tests", n: "3 GREEN TEST RUNS", need: 3 },
  { k: "pushes", n: "EXFIL: PUSH TWICE", need: 2 },
  { k: "commits", n: "LOCK IN 3 COMMITS", need: 3 },
  { k: "flawless", n: "2 FLAWLESS CLEARS", need: 2 },
  { k: "medals", n: "EARN 3 MEDALS", need: 3 },
  { k: "drones", n: "DEPLOY 2 DRONES", need: 2 },
];

const pad = (n) => String(n).padStart(2, "0");
export const dayKey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const freshDay = (key) => ({ d: key, clears: 0, tests: 0, pushes: 0, commits: 0, flawless: 0, medals: 0, drones: 0, done: [] });

/** `n` challenges from `pool`, the first one always included, the same for a whole key (a day or a week). */
function pick(key, pool, n) {
  let seed = Number(key.replaceAll("-", "")) || 1;
  const rest = pool.slice(1);
  const out = [pool[0]];
  while (out.length < n) { seed = (seed * 1103515245 + 12345) % 2147483648; out.push(rest.splice(seed % rest.length, 1)[0]); }
  return out;
}
/** The three challenges of a day: CLEAR first, then two of the others. */
export const todays = (key) => pick(key, POOL, 3);

// ---- weekly challenges: bigger goals, reset on Monday, worth more rank
export const WEEKLY_REWARD = 6; // contract credits (150 XP)
export const WEEK_POOL = [
  { k: "clears", n: "CLEAR 25 CONTRACTS", need: 25 },
  { k: "tests", n: "15 GREEN TEST RUNS", need: 15 },
  { k: "commits", n: "LOCK IN 12 COMMITS", need: 12 },
  { k: "pushes", n: "EXFIL: PUSH 6 TIMES", need: 6 },
  { k: "flawless", n: "10 FLAWLESS CLEARS", need: 10 },
  { k: "medals", n: "EARN 12 MEDALS", need: 12 },
  { k: "drones", n: "DEPLOY 8 DRONES", need: 8 },
];
/** The Monday of the week that holds `d`, as a day key. */
export const weekKey = (d = new Date()) => dayKey(new Date(d.getFullYear(), d.getMonth(), d.getDate() - ((d.getDay() + 6) % 7)));
export const freshWeek = (key) => ({ w: key, clears: 0, tests: 0, pushes: 0, commits: 0, flawless: 0, medals: 0, drones: 0, done: [] });
/** The week's two challenges: CLEAR first, then one of the others. */
export const weeklies = (key) => pick(key, WEEK_POOL, 2);
/** Challenges of `list` reached in `rec` but not yet paid out. */
export const reached = (rec, list) => list.filter((ch) => (rec[ch.k] ?? 0) >= ch.need && !rec.done.includes(ch.k));

export const progress = (day, ch) => Math.min(ch.need, day[ch.k] ?? 0);
/** Challenges reached but not yet paid out. */
export const newlyDone = (day) => todays(day.d).filter((ch) => (day[ch.k] ?? 0) >= ch.need && !day.done.includes(ch.k));

/**
 * Medals for one finished contract.
 *   prior       times (ms) of the clears before this one
 *   errTache    tool failures in the finished task, or null when no hook reports it
 *   worked      the hook saw at least one edit or command (a task that ran nothing earns no FLAWLESS)
 *   firstOfDay  this is today's first clear
 */
export function medalsFor({ prior, now, errTache, worked, firstOfDay }) {
  const medals = [], n = prior.filter((t) => now - t <= 60000).length + 1; // ponytail: a fixed 60 s window; make it a setting if people ask
  if (n >= 3) medals.push("TRIPLE CLEAR"); else if (n === 2) medals.push("DOUBLE CLEAR");
  if (errTache != null) { if (errTache >= 3) medals.push("BOSS DOWN"); else if (errTache === 0 && worked) medals.push("FLAWLESS"); }
  if (firstOfDay) medals.push("FIRST BLOOD");
  return medals;
}

// ---- weapon mastery: a weapon levels up with hits (successful edits and commands) from any operator carrying it
/** Hits needed for level 1..10. */
export const LEVELS = [0, 10, 30, 60, 100, 150, 220, 300, 400, 520];
/** Level a weapon needs before its camo can be picked. */
export const CAMO_LEVEL = { STANDARD: 1, WOODLAND: 1, DESERT: 2, ARCTIC: 3, DIGITAL: 4, TIGER: 5, GOLD: 7, "DARK MATTER": 10 };
export function levelOf(xp) {
  let lv = 1; while (lv < LEVELS.length && xp >= LEVELS[lv]) lv++;
  return { lv, xp, from: LEVELS[lv - 1], to: LEVELS[lv] ?? null, max: lv === LEVELS.length };
}
/** Camos that unlock when a weapon goes from level `a` to level `b`. */
export const unlocked = (a, b) => Object.keys(CAMO_LEVEL).filter((c) => CAMO_LEVEL[c] > a && CAMO_LEVEL[c] <= b);

// ---- how long a contract took
/** 45s, 12m, 1h05m. */
export function fmtDur(ms) {
  const s = Math.max(1, Math.round(ms / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  return m < 60 ? `${m}m` : `${Math.floor(m / 60)}h${pad(m % 60)}m`;
}

// ---- lifetime record and calling cards (never reset by RESET RANK or prestige)
export const freshLife = (clears = 0) => ({ clears, tests: 0, pushes: 0, commits: 0, drones: 0, medals: 0, flawless: 0, run: 0, bestRun: 0, m: {} });
/** Medal bookkeeping for one finished contract: per-medal counts and the run of flawless clears in a row. Mutates `life`. */
export function noteMedals(life, medals) {
  for (const m of medals) life.m[m] = (life.m[m] ?? 0) + 1;
  if (medals.includes("FLAWLESS")) { life.run++; life.bestRun = Math.max(life.bestRun, life.run); } else life.run = 0;
}
/** Titles an operator can show on its card, unlocked by the lifetime record (and prestige). */
export const CARDS = [
  { k: "rookie", n: "ROOKIE", d: "Always yours", ok: () => true },
  { k: "ace", n: "ACE", d: "50 contracts", ok: (l) => l.clears >= 50 },
  { k: "veteran", n: "VETERAN", d: "200 contracts", ok: (l) => l.clears >= 200 },
  { k: "flawless", n: "FLAWLESS X10", d: "10 flawless clears", ok: (l) => l.flawless >= 10 },
  { k: "untouchable", n: "UNTOUCHABLE", d: "5 flawless clears in a row", ok: (l) => l.bestRun >= 5 },
  { k: "range", n: "RANGE READY", d: "25 green test runs", ok: (l) => l.tests >= 25 },
  { k: "scribe", n: "SCRIBE", d: "25 commits", ok: (l) => l.commits >= 25 },
  { k: "exfil", n: "PUSH MASTER", d: "25 pushes", ok: (l) => l.pushes >= 25 },
  { k: "drone", n: "DRONE LORD", d: "10 drones", ok: (l) => l.drones >= 10 },
  { k: "hunter", n: "MEDAL HUNTER", d: "30 medals", ok: (l) => l.medals >= 30 },
  { k: "prestige", n: "PRESTIGE", d: "Prestige once", ok: (_l, p) => p >= 1 },
];
export const cardOf = (k, life, prestige) => CARDS.find((c) => c.k === k && c.ok(life, prestige)) ?? null;
