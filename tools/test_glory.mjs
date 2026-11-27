// Self-check for mods/fireteam/glory.js. Run: node tools/test_glory.mjs
import assert from "node:assert/strict";
import { LEVELS, CAMO_LEVEL, levelOf, unlocked, todays, freshDay, newlyDone, progress, medalsFor, dayKey, POOL } from "../mods/fireteam/glory.js";

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
console.log("glory ok");
