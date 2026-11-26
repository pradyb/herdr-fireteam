#!/usr/bin/env python3
"""Self-check for hooks/fireteam-activity.py: feeds Claude Code, Codex and Gemini payloads, asserts the state file.
Run: python3 tools/test_hook.py   (uses a throwaway HOME, touches nothing real)"""
import json, os, subprocess, sys, tempfile

HOOK = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "hooks", "fireteam-activity.py")
home = tempfile.mkdtemp()
state = os.path.join(home, ".local/state/fireteam/t1.json")


def fire(agent, ev):
    out = subprocess.run([sys.executable, HOOK, *([agent] if agent else [])], input=json.dumps(ev), text=True,
                         capture_output=True, env={**os.environ, "HOME": home, "HC_TERMINAL_ID": "t1"})
    assert out.returncode == 0, out.stderr
    assert json.loads(out.stdout) == ({"async": True} if not agent else {}), out.stdout
    return json.load(open(state)) if os.path.exists(state) else None


# Claude Code
assert fire("", {"hook_event_name": "UserPromptSubmit"})["act"] == "pense"
assert fire("", {"hook_event_name": "PreToolUse", "tool_name": "Edit"})["act"] == "code"
assert fire("", {"hook_event_name": "PostToolUse", "tool_name": "Edit"})["coups"] == 1
assert fire("", {"hook_event_name": "PostToolUseFailure", "tool_name": "Bash", "tool_input": {"command": "pytest"}})["essai"]["ok"] is False

# Codex: apply_patch = edit, Bash = command, PreCompact/PostCompact = compaction, Stop = fini
assert fire("codex", {"hook_event_name": "PreToolUse", "tool_name": "apply_patch", "tool_input": {"command": "*** Begin Patch"}})["act"] == "code"
assert fire("codex", {"hook_event_name": "PreToolUse", "tool_name": "Bash", "tool_input": {"command": "npm test"}})["act"] == "test"
assert fire("codex", {"hook_event_name": "PostToolUse", "tool_name": "Bash", "tool_input": {"command": "git commit -m x"}})["commitT"]
assert fire("codex", {"hook_event_name": "PreCompact", "trigger": "auto"})["act"] == "medite"
assert fire("codex", {"hook_event_name": "PostCompact", "trigger": "auto"})["act"] == "pense"
assert fire("codex", {"hook_event_name": "Stop"})["act"] == "fini"

# Gemini: BeforeAgent/BeforeTool/AfterTool/PreCompress/AfterAgent, failure = tool_response.error
assert fire("gemini", {"hook_event_name": "BeforeAgent", "prompt": "hi"})["act"] == "pense"
assert fire("gemini", {"hook_event_name": "BeforeTool", "tool_name": "read_file", "tool_input": {}})["act"] == "eclaire"
assert fire("gemini", {"hook_event_name": "BeforeTool", "tool_name": "google_web_search", "tool_input": {}})["act"] == "web"
assert fire("gemini", {"hook_event_name": "BeforeTool", "tool_name": "run_shell_command", "tool_input": {"command": "ls"}})["act"] == "commande"
s = fire("gemini", {"hook_event_name": "AfterTool", "tool_name": "write_file", "tool_response": {"llmContent": "ok"}})
assert s["coups"] == 1 and s["err"] == 0
s = fire("gemini", {"hook_event_name": "AfterTool", "tool_name": "run_shell_command", "tool_input": {"command": "pytest"}, "tool_response": {"error": {"message": "x"}}})
assert s["err"] == 1 and s["essai"]["ok"] is False
assert fire("gemini", {"hook_event_name": "PreCompress", "trigger": "auto"})["act"] == "medite"
assert fire("gemini", {"hook_event_name": "AfterAgent"})["act"] == "fini"
assert fire("gemini", {"hook_event_name": "SessionEnd", "reason": "exit"}) is None
print("hook ok")
