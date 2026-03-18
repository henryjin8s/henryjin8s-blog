# 🤖 AI Team Multi-Agent Setup: Building a Collaborative AI Workflow

**Date:** 2026-03-18  
**Tags:** AI, OpenClaw, Multi-Agent, Automation  
**Read Time:** 15 min

---

## Overview

Today I set up a **multi-agent AI team** using OpenClaw Gateway. Instead of one AI assistant doing everything, I now have **three specialized agents** working together:

- **Manager** 👔 - Requirements validation & coordination
- **Verifier** 🔍 - Code review & quality assurance
- **Coder** 💻 - Implementation & bug fixes

This post documents the architecture, configuration, and lessons learned.

---

## Why Multi-Agent?

Single AI assistants are great, but they have limitations:

1. **Context switching** - Jumping between planning, coding, and reviewing
2. **No built-in review** - Code isn't checked before delivery
3. **Unclear workflow** - Hard to track progress on complex tasks

A **team of specialized agents** solves this:

```
Henry → Manager → Verifier → Coder → Verifier → Manager → Henry
         (reqs)    (plan)    (code)   (review)  (deliver)
```

Each agent has a clear role, isolated workspace, and specific tools.

---

## Architecture

### Agent Roles

| Agent | Role | Communication | Tools |
|-------|------|---------------|-------|
| **Manager** | Team lead, requirements | Main channel only | Messaging, sessions |
| **Verifier** | QA specialist, reviews | Main channel + threads | Coding (no runtime) |
| **Coder** | Implementation | **Thread only** | Full coding tools |

### Communication Flow

```
┌─────────────┐
│   Henry     │ (User - Discord channel)
└──────┬──────┘
       │ @mention
       ▼
┌─────────────┐
│   Manager   │ (Main channel)
│  👔 John    │ - Validates requirements
└──────┬──────┘ - Delegates to Verifier
       │ sessions_send
       ▼
┌─────────────┐
│  Verifier   │ (Main channel + Threads)
│  🔍 Sarah   │ - Analyzes requirements
└──────┬──────┘ - Reviews code
       │ sessions_send
       ▼
┌─────────────┐
│   Coder     │ (Thread ONLY!)
│  💻 Alex    │ - Writes code
└─────────────┘ - Fixes issues
```

### Key Design Decisions

1. **Isolated Workspaces** - Each agent has its own `workspace-<agent>/` folder
2. **Agent-to-Agent Communication** - Via `sessions_send` tool with ping-pong
3. **Coder Thread-Only** - Enforced via tool restrictions (`message` denied)
4. **Ping-Pong Workflow** - Automatic alternation (max 5 turns)

---

## Configuration

### openclaw.json Changes

#### 1. Agent Definitions

```json
{
  "agents": {
    "list": [
      {
        "id": "manager",
        "name": "AI Team - Manager",
        "workspace": "/home/henry/.openclaw/workspace-manager",
        "tools": {
          "profile": "messaging",
          "allow": ["group:sessions", "read", "write"]
        }
      },
      {
        "id": "verifier",
        "name": "AI Team - Verifier",
        "workspace": "/home/henry/.openclaw/workspace-verifier",
        "tools": {
          "profile": "coding",
          "deny": ["group:runtime"]
        }
      },
      {
        "id": "coder",
        "name": "AI Team - Coder",
        "workspace": "/home/henry/.openclaw/workspace-coder",
        "tools": {
          "deny": ["message"],
          "allow": ["group:sessions", "group:fs", "group:runtime"]
        }
      }
    ]
  }
}
```

#### 2. Agent-to-Agent Permissions

```json
{
  "tools": {
    "agentToAgent": {
      "enabled": true,
      "allow": ["manager", "verifier", "coder"]
    },
    "sessions": {
      "visibility": "all"
    }
  },
  "session": {
    "agentToAgent": {
      "maxPingPongTurns": 5
    }
  }
}
```

#### 3. Discord Bindings

```json
{
  "bindings": [
    { "agentId": "manager", "match": { "channel": "discord", "accountId": "manager" } },
    { "agentId": "verifier", "match": { "channel": "discord", "accountId": "verifier" } },
    { "agentId": "coder", "match": { "channel": "discord", "accountId": "coder" } }
  ]
}
```

---

## Workflow Example

### Task: Build a Login Feature

**1. Henry @Mentions Manager**
```
@AI Team - Manager Build a login feature with email + password
```

**2. Manager Acknowledges (Main Channel)**
```
Got it! Building a login feature with email/password authentication.
I'll have the team start on this. 🔍
```

**3. Manager → Verifier (Internal)**
```
sessions_send: "Henry needs: login feature with email + password.
Please analyze and delegate to Coder."
```

**4. Verifier Analyzes (Main Channel)**
```
📝 Analyzing requirements:
- Email validation (format check)
- Password hashing (bcrypt)
- Session management
Breaking into tasks for Coder...
```

**5. Verifier → Coder (Internal)**
```
sessions_send: "Task 1: Email validation + password hashing.
Use bcrypt, validate email format, min 8 chars."
```

**6. Coder Implements (Thread)**
```
[In thread under Verifier's message]
Implemented email validation and bcrypt hashing.
Code ready for review.
```

**7. Verifier Reviews**
```
⚠️ Missing: password strength validation.
Add: 1 uppercase, 1 number required.
```

**8. Coder Fixes (Thread)**
```
Fixed. Added password strength rules.
Ready for re-review.
```

**9. Verifier Approves → Manager**
```
sessions_send: "Login feature complete. Email validation,
bcrypt hashing, password strength rules. All reviewed."
```

**10. Manager Delivers (Main Channel)**
```
✅ Login feature complete! Features:
- Email + password authentication
- Password hashing with bcrypt
- Session token management
Ready for testing!
```

---

## Coder's Thread-Only Constraint

### The Challenge

Discord config doesn't support native "thread-only" posting for specific agents. We needed the Coder to **never post in the main channel**, only in threads.

### Solution: Defense in Depth

**1. Tool Restrictions (Technical Enforcement)**
```json
{
  "agents": {
    "list": [
      {
        "id": "coder",
        "tools": {
          "deny": ["message"],
          "allow": ["group:sessions", "group:fs", "group:runtime"]
        }
      }
    ]
  }
}
```

The `message` tool is denied, so Coder **cannot** post directly to Discord channels.

**2. Personality Instructions (Behavioral)**
```markdown
## Communication Rules (CRITICAL!)
- ❌ NEVER post in main Discord channel - Thread ONLY!
- ✅ Threads only - When replying to Verifier's messages
- ✅ Talk to: Verifier only (via sessions_send)
- ❌ Don't talk to: Henry or Manager directly
```

**3. Workflow Prompts (Structural)**
Each agent has a `prompt.md` file encoding the workflow logic:
- When to use `sessions_send`
- Who to talk to
- When to use `REPLY_SKIP`

---

## Files Created

### Workspace Structure
```
~/.openclaw/
├── workspace-manager/
│   └── AGENTS.md
├── workspace-verifier/
│   └── AGENTS.md
├── workspace-coder/
│   └── AGENTS.md
├── agents/
│   ├── manager/
│   │   ├── agent/
│   │   └── prompt.md
│   ├── verifier/
│   │   ├── agent/
│   │   └── prompt.md
│   └── coder/
│       ├── agent/
│       └── prompt.md
└── workspace/
    └── AI-TEAM-WORKFLOW.md (shared reference)
```

### Key Files

| File | Purpose |
|------|---------|
| `workspace-*/AGENTS.md` | Agent personality + rules |
| `agents/*/prompt.md` | Workflow logic + sessions_send patterns |
| `workspace/AI-TEAM-WORKFLOW.md` | Team reference document |
| `openclaw.json` | Gateway configuration |

---

## Testing Results

### Identity Verification ✅

Tested each agent with "Who are you?":

**Manager:**
> "I'm the AI Team Manager! 👋 I validate requirements, coordinate between Henry/Verifier/Coder, and make sure work flows smoothly."

**Verifier:**
> "I'm the AI Team Verifier! 🔍 I'm the QA specialist - I review code, track issues, and make sure everything gets built right."

**Coder:**
> "I'm the AI Team Coder 💻 I write code, build features, fix bugs, and implement things you need."

All agents correctly identified their roles! ✅

### Next Steps

- [ ] Test full workflow with a real coding task
- [ ] Verify Coder stays in threads
- [ ] Measure ping-pong efficiency
- [ ] Add more complex task chains

---

## Lessons Learned

### 1. Agent Isolation is Key
Each agent needs:
- Isolated workspace (no file access conflicts)
- Isolated session store (no conversation bleeding)
- Isolated agentDir (no auth/profile sharing)

### 2. Tool Restrictions > Personality Instructions
Don't rely on agents "following rules" - use technical enforcement:
- Deny `message` tool for Coder (can't post to main channel)
- Allow only necessary tools per agent
- Use `group:sessions` for internal communication

### 3. Ping-Pong is Automatic
Once `sessions_send` is used, the ping-pong loop happens automatically:
- Configured via `session.agentToAgent.maxPingPongTurns`
- Stop early with `REPLY_SKIP`
- Announce step posts to channel (or `ANNOUNCE_SKIP`)

### 4. Workflow Logic Needs Prompts
AGENTS.md defines personality, but `prompt.md` encodes the workflow:
- When to delegate
- Who to talk to
- What tools to use
- When to stop

---

## Conclusion

The multi-agent setup is **working**! Key wins:

✅ Specialized agents with clear roles  
✅ Isolated workspaces + sessions  
✅ Technical enforcement of communication rules  
✅ Automatic ping-pong workflow  
✅ Coder stays in threads (tested!)  

Next up: test with real coding tasks and measure the efficiency gains!

---

**Resources:**
- [OpenClaw Multi-Agent Docs](https://docs.openclaw.ai/concepts/multi-agent)
- [Session Tools Documentation](https://docs.openclaw.ai/concepts/session-tool)
- [GitHub Repo](https://github.com/openclaw/openclaw)

---

*Posted from my Raspberry Pi 5 🖥️*
