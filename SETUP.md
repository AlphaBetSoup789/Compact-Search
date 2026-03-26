# Compact — MCP & client setup

Quick reference for getting Compact (`oracle_search` / `oracle_log`) running in each client. Full multi-client table and OpenClaw: [CLIENTS.md](CLIENTS.md). MCP server build: [mcp-server/README.md](mcp-server/README.md).

---

## Prerequisites

- A Compact beta API key — get one at [usecompact.dev](https://usecompact.dev)
- Node.js 18+

From this repo (after clone):

```bash
cd mcp-server
npm install
npm run build
```

Then use the path to `mcp-server/dist/index.js` in your client config (absolute path, or relative to workspace when supported). Set `ORACLE_API_KEY` to your beta key in each client's env config.

---

## Cursor

1. **Settings → MCP**.
2. Add a server; use the **absolute path** to `mcp-server/dist/index.js` (e.g. `C:/Users/You/compact/mcp-server/dist/index.js` on Windows).

Config file: `~/.cursor/mcp.json` (Windows: `%USERPROFILE%\.cursor\mcp.json`).

```json
{
  "mcpServers": {
    "oracle-knowledge": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-server/dist/index.js"],
      "env": {
        "ORACLE_API_KEY": "your-beta-key-here"
      }
    }
  }
}
```

Restart Cursor after changing config.

---

## Claude Code

Use the same MCP server as Cursor: `claude mcp add` or edit `~/.claude/mcp.json` with the same `mcpServers` structure (command, args, env). Restart Claude Code.

---

## Claude Desktop (Anthropic app)

Same MCP server; config file location only:

- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

Use the same `mcpServers` → `oracle-knowledge` block as Cursor. Restart Claude Desktop.

---

## Gemini CLI

Config file:

- **macOS / Linux:** `~/.gemini/settings.json`
- **Windows:** `%USERPROFILE%\.gemini\settings.json`

Add (replace the path with your absolute path to `mcp-server/dist/index.js`; on Windows use forward slashes):

```json
{
  "mcpServers": {
    "oracle-knowledge": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-server/dist/index.js"],
      "env": {
        "ORACLE_API_KEY": "your-beta-key-here"
      }
    }
  }
}
```

Restart Gemini CLI, then try: *"Search oracle for how to configure Prisma with PostgreSQL"*.

---

## VS Code (GitHub Copilot agent mode)

Requires **Copilot with agent mode** enabled. This repo includes a ready-made workspace config.

- **If this repo is your workspace:** Open the repo root in VS Code. The file `.vscode/mcp.json` is already present and uses the path `mcp-server/dist/index.js` (relative to the repo). Reload the window or restart VS Code, then start a Copilot agent chat and ask e.g. how to connect Prisma to Postgres.
- **If you use another workspace:** Create `.vscode/mcp.json` in your project root with the same structure; set `args` to the absolute path to your `mcp-server/dist/index.js`.

Example (workspace = this repo):

```json
{
  "servers": {
    "oracle-knowledge": {
      "type": "stdio",
      "command": "node",
      "args": ["mcp-server/dist/index.js"],
      "env": {
        "ORACLE_API_KEY": "your-beta-key-here"
      }
    }
  }
}
```

Note: VS Code uses `"servers"` and requires `"type": "stdio"`.

---

## OpenClaw (skill, not MCP)

OpenClaw uses the Compact **skill** (HTTP to the API), not the MCP server. See [CLIENTS.md § OpenClaw](CLIENTS.md#openclaw): copy `SKILL.md` to `~/.openclaw/skills/compact/SKILL.md`, set `ORACLE_API_KEY` and `compact.searchUrl` / `compact.logUrl` in `~/.openclaw/openclaw.json`, then `openclaw skills list --eligible`.

---

## Env reference

| Variable | Required | Purpose |
|----------|----------|---------|
| `ORACLE_API_KEY` | **Yes** | Beta API key; sent as `Authorization: Bearer` and `X-API-Key`. Get one at [usecompact.dev](https://usecompact.dev). |
| `ORACLE_SEARCH_API_URL` | No (defaults to gate) | Override the search endpoint only if instructed. |
| `ORACLE_LOG_API_URL` | No (defaults to gate) | Override the log endpoint only if instructed. |
| `ORACLE_SEARCH_API_KEY` | No | Alias for `ORACLE_API_KEY`; wins if both are set. |
