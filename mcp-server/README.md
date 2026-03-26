# Compact MCP Server

MCP server that exposes **oracle_search** so Cursor, Claude Code, Gemini, and other MCP-capable clients can query the [Compact](https://usecompact.dev) knowledge cache.

## Prerequisites

- Node.js 18+
- A Compact beta API key — get one at [usecompact.dev](https://usecompact.dev)

## Setup

```bash
cd mcp-server
npm install
npm run build
```

## Configuration

| Env var | Description |
|--------|-------------|
| `ORACLE_API_KEY` | **Required.** Beta API key sent as `Authorization: Bearer` and `X-API-Key`. Get one at [usecompact.dev](https://usecompact.dev). |
| `ORACLE_SEARCH_API_URL` | Search endpoint. Default: `https://gate.usecompact.dev/search` (do not change unless instructed). |
| `ORACLE_LOG_API_URL` | Log endpoint for `oracle_log`. Default: `https://gate.usecompact.dev/log` |
| `ORACLE_SEARCH_API_KEY` | Alias for `ORACLE_API_KEY`; wins if both are set. |

Copy `.env.example` to `.env` and fill in your key, or set `ORACLE_API_KEY` directly in your IDE's MCP env config (recommended).

## Run locally

```bash
npm run start
# or
npm run dev
```

## Add to your IDE

See the repo root [SETUP.md](../SETUP.md) for Cursor, Claude, Gemini CLI, VS Code, and OpenClaw. In **Settings → MCP** (Cursor), add a server. Use the path to `dist/index.js` in this folder (after `npm run build`).

**Example (`~/.cursor/mcp.json`):**

```json
{
  "mcpServers": {
    "compact": {
      "command": "node",
      "args": ["/path/to/compact-public/mcp-server/dist/index.js"],
      "env": {
        "ORACLE_API_KEY": "your-beta-key-here"
      }
    }
  }
}
```

On Windows use the full path with forward slashes, e.g. `C:/Users/You/compact-public/mcp-server/dist/index.js`.

## Tools

- **oracle_search**
  - `query` (required): natural language or keyword.
  - `limit` (optional): max results, default 5.
  - `git_repo` (optional): filter by repo (e.g. `prisma/prisma`).
  - `version` (optional): major or prefix version; sent to the API as `release_version`.
- **oracle_log**
  - `query` (required): the query that failed or was insufficient.
  - `git_repo`, `reason`, `source`, `timestamp` (optional): see [SEARCH-API.md](../SEARCH-API.md) / OpenClaw skill for log body shape.

## API contract

The server calls the endpoint described in the repo root [SEARCH-API.md](../SEARCH-API.md). Any HTTP client can use the same URL, auth header, and JSON body; MCP is optional.

## Publish to npm

Before publishing:

1. Confirm `repository` in `package.json` matches your GitHub layout (default: [AlphaBetSoup789/Compact-Search](https://github.com/AlphaBetSoup789/Compact-Search), subdirectory `mcp-server`).
2. Run `npm run build` (or rely on `prepublishOnly`).
3. `npm publish` or `npm publish --access public` for a scoped package.

Users can then run:

```bash
npx oracle-knowledge-mcp
```

and point their MCP config at the `oracle-mcp` binary or `node_modules/.bin/oracle-mcp`, with env vars set in the client config.
