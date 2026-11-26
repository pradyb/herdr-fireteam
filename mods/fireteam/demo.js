// Demo data for screenshots (props.demo on a block): invented agents, spaces, feed and stats, so a
// preview never shows anyone's projects. Used by tools/preview.sh; nothing here is read in normal use.

const now = Date.now();
const prog = (key, name) => ({ key, name, icon: null, tint: false, tile: null, color: null, shell: false, agent: true });
const ag = (n, status, key, name, title, tab, focused = false) => ({
  address: `d${n}`, pane: `dp${n}`, space: `ds${tab[0]}`, space_name: "", tab: `dt${n}`, tab_index: 1, tab_name: tab[1], status, app: key,
  program: prog(key, name), title, pane_name: null, seq: n, pinned: false, focused,
});
const tab = (n, name, status, active = false) => ({ id: `dt${n}`, index: 1, name, named: true, active, status, panes: 1, zoomed: false, settled: false, settled_at: null, changed_at: null, working_since: null });
const space = (id, index, name, branch, tabs, active = false) => ({ id: `ds${id}`, index, name, named: true, folder: "", machine: null, branch, active, status: tabs.map((t) => t.status).find(Boolean) ?? null, tabs });

export const DEMO = {
  agents: [
    ag(1, "working", "claude", "Claude Code", "Fix the auth flow", [1, "auth fix"], true),
    ag(2, "blocked", "codex", "Codex", "Write the migration", [1, "migration"]),
    ag(3, "done", "gemini", "Gemini", "Docs pass", [2, "docs"]),
    ag(4, "working", "opencode", "OpenCode", "Profile the parser", [3, "perf"]),
    ag(5, "idle", "cursor", "Cursor", "Review PR 214", [4, "review"]),
  ],
  spaces: [
    space(1, 1, "api-gateway", "main", [tab(1, "auth fix", "working", true), tab(2, "migration", "blocked")], true),
    space(2, 2, "docs-site", "docs", [tab(3, "docs", "done")]),
    space(3, 3, "mobile-app", "perf", [tab(4, "perf", "working")]),
    space(4, 4, "infra", "main", [tab(5, "review", "idle")]),
  ],
  shared: {
    "fireteam.kills": 9, "fireteam.streak": 5,
    "fireteam.act": { d1: { act: "code", tool: "Edit" }, d4: { act: "eclaire", tool: "Grep" } },
    "fireteam.stats": { d1: { hits: 42, errs: 3, reads: 18, subs: 2 }, d4: { hits: 11, errs: 1, reads: 30, subs: 0 } },
    "fireteam.loadout": { d1: { gun: "M4A1", camo: "WOODLAND", perks: ["ghost", "scavenger", "hardline"] }, d2: { gun: "MP7", camo: "GOLD", perks: ["quickfix", "overkill", "tracker"] }, d3: { gun: "SA87", camo: "ARCTIC", perks: [null, null, null] } },
    "fireteam.feed": [
      { t: now - 240e3, k: "info", who: "Nomad", unit: "RG", gun: "", tgt: "DEPLOYED · PROFILE THE PARSER" },
      { t: now - 170e3, k: "kill", who: "Specter", unit: "SC", gun: "gun-sniper", tgt: "DOCS" },
      { t: now - 120e3, k: "warn", who: "Havoc", unit: "SC", gun: "", tgt: "NEEDS BACKUP · WRITE THE MIGRATION" },
      { t: now - 60e3, k: "kill", who: "Ember", unit: "TF", gun: "gun-ar", tgt: "AUTH FIX" },
      { t: now - 20e3, k: "info", who: "COMMAND", unit: "HQ", gun: "", tgt: "UAV ONLINE" },
    ],
  },
};

const LINES = [
  ["#8c9087", "$ claude"], ["#d9dccb", ""],
  ["#63d06a", "● Edit(src/auth/session.ts)"], ["#8c9087", "  ⎿ Updated 12 lines, removed the stale token path"],
  ["#63d06a", "● Bash(npm test -- auth)"], ["#8c9087", "  ⎿ 48 passed, 0 failed"],
  ["#d9dccb", ""], ["#d9dccb", "Session refresh now rotates the token on every call."], ["#d9dccb", "Next: wire the new error codes into the client."],
  ["#d9dccb", ""], ["#f2a516", "> _"],
];
/** A fake terminal for the preview layout (role "demoterm"). */
export const demoTerm = (div, P) => div().size_full().bg("#0b0e0c").p(18).flex().flex_col().gap(3).children(
  LINES.map(([c, s]) => div().font_family("JetBrains Mono").text_size(13).text_color(c).child(s || " ")));
