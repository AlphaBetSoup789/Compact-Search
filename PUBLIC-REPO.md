# Public repo seed

This folder is the **seed for the public GitHub repo**. It contains only what should be public:

- **Root:** README, SETUP.md, API contract (SEARCH-API.md), contribution guide (CONTRIBUTION-SYSTEM.md), client/skill docs (CLIENTS.md, SKILL.md), .gitignore
- **.vscode/mcp.json:** Workspace MCP config so VS Code (Copilot agent) can use Compact when this repo is the workspace
- **mcp-server/:** MCP server source (no `node_modules`, no `.env`; run `npm install && npm run build`)

To publish:

1. Public repo: [AlphaBetSoup789/Compact-Search](https://github.com/AlphaBetSoup789/Compact-Search).
2. Copy this folder’s contents into the repo root (or make this folder the repo root).
3. `mcp-server/package.json` → `repository` points at that repo with `"directory": "mcp-server"`. Change only if your layout differs.
4. Push. Add a root `LICENSE` if not already present (the GitHub repo may already have one).

Nothing in here references internal paths, secrets, or private infra.
