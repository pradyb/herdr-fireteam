// Self-check for mods/fireteam/glory.js. Run: node tools/test_glory.mjs
import assert from "node:assert/strict";
import { LEVELS, CAMO_LEVEL, levelOf, unlocked, todays, freshDay, newlyDone, progress, medalsFor, dayKey, POOL, weekKey, freshWeek, weeklies, reached, WEEK_POOL, fmtDur, freshLife, noteMedals, CARDS, cardOf } from "../mods/fireteam/glory.js";

const t = todays("2026-11-27");
assert.equal(t.length, 3); assert.equal(t[0].k, "clears"); assert.equal(new Set(t.map((c) => c.k)).size, 3);
assert.deepEqual(todays("2026-11-27"), t); // same all day
assert.ok(new Set(["2026-11-27", "2026-11-28", "2026-11-29", "2026-11-30", "2026-12-01"].map((d) => todays(d).map((c) => c.k).join())).size > 1); // varies by day
assert.equal(dayKey(new Date(2026, 10, 5)), "2026-11-05");

const day = freshDay("2026-11-27");
assert.deepEqual(newlyDone(day), []);
day.clears = 7; assert.equal(progress(day, POOL[0]), 5);
assert.deepEqual(newlyDone(day).map((c) => c.k), ["clears"]);
day.done.push("clears"); assert.deepEqual(newlyDone(day), []);

const m = (o) => medalsFor({ prior: [], now: 100000, errTache: null, worked: false, firstOfDay: false, ...o });
assert.deepEqual(m({}), []);
assert.deepEqual(m({ firstOfDay: true }), ["FIRST BLOOD"]);
assert.deepEqual(m({ errTache: 0, worked: true }), ["FLAWLESS"]);
assert.deepEqual(m({ errTache: 0, worked: false }), []); // ran nothing: not flawless
assert.deepEqual(m({ errTache: 3 }), ["BOSS DOWN"]);
assert.deepEqual(m({ errTache: 1, worked: true }), []);
assert.deepEqual(m({ prior: [60000] }), ["DOUBLE CLEAR"]);
assert.deepEqual(m({ prior: [90000, 95000] }), ["TRIPLE CLEAR"]);
assert.deepEqual(m({ prior: [30000] }), []); // 70 s ago: outside the window
assert.deepEqual(m({ prior: [95000], errTache: 0, worked: true, firstOfDay: true }), ["DOUBLE CLEAR", "FLAWLESS", "FIRST BLOOD"]);

assert.equal(levelOf(0).lv, 1); assert.equal(levelOf(9).lv, 1); assert.equal(levelOf(10).lv, 2);
assert.equal(levelOf(149).lv, 5); assert.equal(levelOf(150).lv, 6);
assert.deepEqual([levelOf(30).from, levelOf(30).to], [30, 60]);
assert.ok(levelOf(520).max && levelOf(9999).lv === LEVELS.length && levelOf(9999).to === null);
assert.deepEqual(unlocked(1, 2), ["DESERT"]); assert.deepEqual(unlocked(3, 6), ["DIGITAL", "TIGER"]);
assert.deepEqual(unlocked(1, 10), ["DESERT", "ARCTIC", "DIGITAL", "TIGER", "GOLD", "DARK MATTER"]);
assert.deepEqual(unlocked(5, 5), []);
assert.equal(CAMO_LEVEL.STANDARD, 1);

// weekly: Monday-based keys, 2 challenges (clears first), same all week, payout once
assert.equal(weekKey(new Date(2026, 10, 27)), "2026-11-23"); // Friday -> Monday
assert.equal(weekKey(new Date(2026, 10, 23)), "2026-11-23"); // Monday
assert.equal(weekKey(new Date(2026, 10, 29)), "2026-11-23"); // Sunday
assert.equal(weekKey(new Date(2026, 11, 1)), "2026-11-30");
const w = weeklies("2026-11-23"); assert.equal(w.length, 2); assert.equal(w[0].k, "clears"); assert.notEqual(w[1].k, "clears");
assert.deepEqual(weeklies("2026-11-23"), w);
const wk = freshWeek("2026-11-23"); assert.deepEqual(reached(wk, w), []);
wk.clears = 25; assert.deepEqual(reached(wk, w).map((c) => c.k), ["clears"]);
wk.done.push("clears"); assert.deepEqual(reached(wk, w), []);
assert.ok(WEEK_POOL.every((c) => c.need > (POOL.find((p) => p.k === c.k)?.need ?? 0))); // weekly is harder than daily

// clear time
assert.equal(fmtDur(400), "1s"); assert.equal(fmtDur(45000), "45s"); assert.equal(fmtDur(12 * 60000), "12m");
assert.equal(fmtDur(65 * 60000), "1h05m"); assert.equal(fmtDur(120 * 60000), "2h00m");

// lifetime and cards
const life = freshLife(7); assert.equal(life.clears, 7);
noteMedals(life, ["FLAWLESS", "FIRST BLOOD"]); noteMedals(life, ["FLAWLESS"]); assert.equal(life.run, 2); assert.equal(life.m.FLAWLESS, 2);
noteMedals(life, []); assert.equal(life.run, 0); assert.equal(life.bestRun, 2);
assert.ok(cardOf("rookie", life, 0)); assert.equal(cardOf("ace", life, 0), null); assert.equal(cardOf("nope", life, 0), null);
life.clears = 50; assert.ok(cardOf("ace", life, 0)); assert.equal(cardOf("prestige", life, 0), null); assert.ok(cardOf("prestige", life, 1));
assert.equal(new Set(CARDS.map((c) => c.k)).size, CARDS.length);
console.log("glory ok");
