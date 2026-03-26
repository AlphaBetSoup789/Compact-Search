# Compact — Multi-Client Setup Guide

## Supported clients

| Client | Mechanism | Config location |
|---|---|---|
| Cursor | MCP | `~/.cursor/mcp.json` |
| Claude Code | MCP | `claude mcp add` or `~/.claude/mcp.json` |
| Gemini CLI | MCP | `~/.gemini/settings.json` |
| OpenClaw | Skill | `~/.openclaw/skills/compact/SKILL.md` |
| VS Code (Copilot) | MCP | `.vscode/mcp.json` (workspace) |

All MCP clients use the same `index.js` server. Only the config file location differs.

---

## Gemini CLI

See [SETUP.md](SETUP.md) for step-by-step and Windows paths. Summary below.

### Config file location

- **macOS / Linux:** `~/.gemini/settings.json`
- **Windows:** `%USERPROFILE%\.gemini\settings.json`

### Add Compact to settings.json

Replace the `args` path with your absolute path to `mcp-server/dist/index.js` (Windows: use forward slashes).

```json
{
  "mcpServers": {
    "oracle-knowledge": {
      "command": "node",
      "args": ["/path/to/compact/mcp-server/dist/index.js"],
      "env": {
        "ORACLE_API_KEY": "your-beta-key-here"
      }
    }
  }
}
```

### Verify

Restart Gemini CLI, then: *"Search oracle for how to configure Prisma with PostgreSQL"*. The tool call appears in the reasoning output.

---

## Cursor

See [SETUP.md](SETUP.md) for step-by-step. Add a server in **Settings → MCP**. Config file: `~/.cursor/mcp.json`. Use the path to `mcp-server/dist/index.js` after building, or use `npx oracle-knowledge-mcp` if published. See [mcp-server/README.md](mcp-server/README.md).

---

## Claude Code

See [SETUP.md](SETUP.md). Use `claude mcp add` or edit `~/.claude/mcp.json`. Same env and command pattern as Cursor.

---

## OpenClaw

OpenClaw uses a `SKILL.md` file rather than MCP. The skill teaches the agent
when and how to call the Compact API directly via HTTP.

### Install locally

```bash
# Create the skill directory
mkdir -p ~/.openclaw/skills/compact

# Copy the SKILL.md file from this repo
cp SKILL.md ~/.openclaw/skills/compact/SKILL.md

# Set your API key
export ORACLE_API_KEY=your-api-key-here

# Add gate URLs to openclaw.json
# Edit ~/.openclaw/openclaw.json and add:
# {
#   "compact": {
#     "searchUrl": "https://gate.usecompact.dev/search",
#     "logUrl": "https://gate.usecompact.dev/log"
#   }
# }
```

### Verify

```bash
# Check the skill is eligible
openclaw skills list --eligible

# Should show: compact — Query Compact for versioned procedural docs...
```

### Publish to ClawHub (optional)

Once you have an account on clawhub.com:

```bash
# From the skill directory
cd ~/.openclaw/skills/compact
clawhub publish
```

Users can then install it with:
```bash
clawhub install compact
```

---

## VS Code (GitHub Copilot agent mode)

See [SETUP.md](SETUP.md) for step-by-step and Windows. Requires **Copilot with agent mode** enabled.

This repo includes a ready-made `.vscode/mcp.json` so that when you open the repo in VS Code, the Compact MCP is configured (path: `mcp-server/dist/index.js`). Reload the window or restart VS Code, then use a Copilot agent chat to try e.g. *"How do I connect Prisma to Postgres?"*.

To use Compact in a different workspace, create `.vscode/mcp.json` there with the same structure; set `args` to your absolute path to `mcp-server/dist/index.js`. Config uses `"servers"` (not `mcpServers`) and `"type": "stdio"`.

---

## Environment variable reference

| Variable | Required | Used by |
|---|---|---|
| `ORACLE_API_KEY` | **Yes** | MCP server + OpenClaw skill — beta API key sent as `Authorization: Bearer`. Get one at [usecompact.dev](https://usecompact.dev). |
| `ORACLE_SEARCH_API_URL` | No (defaults to gate) | MCP server — override only if instructed |
| `ORACLE_LOG_API_URL` | No (defaults to gate) | MCP server (`oracle_log` tool) |
| `ORACLE_SEARCH_API_KEY` | No | Alias for `ORACLE_API_KEY` (wins if both set) |

For OpenClaw, the search and log URLs come from `~/.openclaw/openclaw.json`
rather than environment variables, but `ORACLE_API_KEY` is still an env var.

---

## Query limit

Use 1–3 results for targeted searches (fewer tokens), 3–7 for broad "walk me through" queries. Avoid 10 — wastes tokens.
