#!/usr/bin/env python3
"""Fireteam (Herdr layout): what each Claude Code agent is doing, for the HUD. Derived from World of Codecraft (MIT, Kevin Pardo).

Claude Code hook (async, never blocks). Writes ~/.local/state/fireteam/<HC_TERMINAL_ID>.json, read by
~/.config/herdr-app/mods/fireteam/side.js for the live actions, hit-markers and stats.

  act      pense (thinking) | eclaire (reading/searching) | code (editing) | commande (bash)
           | test (running tests) | web (web search/fetch) | medite (compacting) | fini (turn over)
  outil    last tool name          t      last event (ms)       depuis  when act started (ms)
  coups    successful edits and commands this task (each one = a blow on the creature)
  err      consecutive tool failures, errT the last one (ms)
  subs     running subagents       tache  prompt counter (seeds the creature drawn for the task)
  errTache tool failures this task (3+ = the next creature is a boss)
  essai    last test run {ok, t} (act "test" while it runs)   commitT / pushT  last git commit / push (ms)

Outside Herdr (no HC_TERMINAL_ID) it does nothing. Subagents' own tool calls are ignored.

One script for three agents: no argument = Claude Code, `codex` = OpenAI Codex CLI, `gemini` = Gemini CLI. The other two
send the same kind of JSON under other event and tool names, translated to Claude Code's by ALIAS_* below.
Known limit: Codex has no tool-failure event, so only Claude Code and Gemini report DAMAGE TAKEN.
"""
import fcntl, json, os, re, sys, time

term = os.environ.get("HC_TERMINAL_ID")
if not term:
    sys.exit(0)
try:
    ev = json.load(sys.stdin)
except Exception:
    sys.exit(0)
AGENT = sys.argv[1] if len(sys.argv) > 1 else "claude"
# Claude Code: tell it not to wait for us (async hook response). Codex and Gemini want plain JSON, "{}" is a no-op.
print('{"async": true}' if AGENT == "claude" else "{}", flush=True)

DIR = os.path.expanduser("~/.local/state/fireteam")
os.makedirs(DIR, exist_ok=True)
path = os.path.join(DIR, f"{term}.json")
# Gemini and Codex event / tool names, as Claude Code calls them
ALIAS_EVENT = {"BeforeAgent": "UserPromptSubmit", "BeforeTool": "PreToolUse", "AfterTool": "PostToolUse",
               "PreCompress": "PreCompact", "AfterAgent": "Stop", "PostCompact": "SessionStart", "Interrupt": "Stop"}
ALIAS_TOOL = {"run_shell_command": "Bash", "write_file": "Edit", "replace": "Edit", "apply_patch": "Edit",
              "read_file": "Read", "read_many_files": "Read", "glob": "Read", "grep_search": "Read", "list_directory": "Read",
              "google_web_search": "WebSearch", "web_fetch": "WebFetch"}
name = ALIAS_EVENT.get(ev.get("hook_event_name", ""), ev.get("hook_event_name", ""))
if ev.get("hook_event_name") == "PostCompact":
    ev["source"] = "compact"
if name == "PostToolUse" and isinstance(ev.get("tool_response"), dict) and ev["tool_response"].get("error"):
    name = "PostToolUseFailure"  # Gemini: a failed tool has tool_response.error
tool = ALIAS_TOOL.get(ev.get("tool_name") or "", ev.get("tool_name") or "")
sub = bool(ev.get("agent_id"))
now = int(time.time() * 1000)
cmd = str((ev.get("tool_input") or {}).get("command") or "") if tool == "Bash" else ""
# drop heredoc bodies and quoted strings: only the commands themselves count
cmd = re.sub(r"<<-?\s*['\"]?(\w+)['\"]?[^\n]*\n.*?\n\s*\1\b", " ", cmd, flags=re.S)
cmd = re.sub(r"'[^']*'|\"(?:\\.|[^\"\\])*\"", "''", cmd)
# only real commands: at the start of the command line or after ; & | ( (not inside quoted text or heredocs)
AT = r"(?:^|[;&|(]\s*)(?:\w+=\S+\s+)*"
TEST = re.compile(AT + r"((bun|npm|pnpm|yarn|npx|bunx)\s+(run\s+)?test|vitest|jest|pytest|playwright\s+test|cargo\s+test|go\s+test|rspec|phpunit|mix\s+test|deno\s+test)\b", re.M)
COMMIT = re.compile(AT + r"git\s+(-C\s+\S+\s+)?commit\b", re.M)
PUSH = re.compile(AT + r"git\s+(-C\s+\S+\s+)?push\b", re.M)

READ = {"Read", "Grep", "Glob", "LS", "NotebookRead", "LSP", "ToolSearch"}
EDIT = {"Edit", "Write", "MultiEdit", "NotebookEdit"}
WEB = {"WebSearch", "WebFetch"}


def kind(t):
    if t in EDIT:
        return "code"
    if t in READ:
        return "eclaire"
    if t == "Bash":
        return "test" if TEST.search(cmd) else "commande"
    if t in WEB or (t.startswith("mcp__") and any(k in t for k in ("search", "fetch", "scrape", "exa", "firecrawl", "context7", "docs"))):
        return "web"
    return None  # Agent, TodoWrite, Skill, AskUserQuestion...: keep the current scene


if name == "SessionEnd":
    try:
        os.remove(path)
    except OSError:
        pass
    sys.exit(0)

with open(os.path.join(DIR, ".lock"), "w") as lk:
    fcntl.flock(lk, fcntl.LOCK_EX)
    try:
        with open(path) as f:
            s = json.load(f)
    except Exception:
        s = {}
    s.setdefault("tache", 0)
    s.setdefault("subs", 0)

    def act(a):
        if s.get("act") != a:
            s["act"], s["depuis"] = a, now

    if name in ("SubagentStart",):
        s["subs"] = s["subs"] + 1
    elif name == "SubagentStop":
        s["subs"] = max(0, s["subs"] - 1)
    elif sub:
        pass  # a subagent's own tools: the main hero's scene stays
    elif name == "UserPromptSubmit":
        s.update(tache=s["tache"] + 1, coups=0, err=0, errTache=0)
        act("pense")
    elif name == "PreToolUse":
        k = kind(tool)
        if k:
            act(k)
        s["outil"] = tool
    elif name == "PostToolUse":
        if tool in EDIT or tool == "Bash":  # every successful edit or command is a blow on the creature
            s["coups"] = s.get("coups", 0) + 1
        s["err"] = 0
        if TEST.search(cmd):
            s["essai"] = {"ok": True, "t": now}
        if COMMIT.search(cmd):
            s["commitT"] = now
        if PUSH.search(cmd):
            s["pushT"] = now
    elif name == "PostToolUseFailure":
        s["err"] = s.get("err", 0) + 1
        s["errTache"] = s.get("errTache", 0) + 1
        s["errT"] = now
        if TEST.search(cmd):
            s["essai"] = {"ok": False, "t": now}
    elif name == "PreCompact":
        act("medite")
    elif name == "SessionStart":
        if ev.get("source") == "compact":
            act("pense")
        else:
            s.update(subs=0, err=0, coups=0)
            act("fini")
    elif name == "Stop":
        s["subs"] = 0
        act("fini")
    s["t"] = now
    tmp = path + ".tmp"
    with open(tmp, "w") as f:
        json.dump(s, f)
    os.replace(tmp, path)
