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

/** The three challenges of a day: CLEAR first, then two of the others, the same for the whole day. */
export function todays(key) {
  let seed = Number(key.replaceAll("-", "")) || 1;
  const rest = POOL.slice(1);
  const out = [POOL[0]];
  while (out.length < 3) { seed = (seed * 1103515245 + 12345) % 2147483648; out.push(rest.splice(seed % rest.length, 1)[0]); }
  return out;
}
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
