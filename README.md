# Compact

**Versioned, procedural docs for 70+ APIs and libraries. Less context, better code.**

[usecompact.dev](https://usecompact.dev) · [Source on GitHub](https://github.com/AlphaBetSoup789/Compact-Search)

Compact is a knowledge cache of actionable procedures — installation steps, configuration patterns, code snippets — extracted from official docs and from developer field trials. Agents and IDEs query it before generating integration code so they get current, versioned answers instead of outdated training data.

---

## Why Compact?

AI coding assistants hallucinate integration code. They confidently generate API calls for library versions they were never trained on, skip required config steps, and miss the one flag that makes everything work. You find out at runtime.

Compact fixes the retrieval problem, not the model:

- **Fewer tokens, lower cost** — one targeted query returns the exact procedure instead of feeding entire docs or repository files into the context window
- **Less hallucination** — versioned, sourced procedures give the model ground truth to work from instead of interpolating from training data
- **Local and open-source models punch above their weight** — a model with no web access and a smaller context window can produce correct integration code when Compact hands it the right steps up front; no browsing, no RAG pipeline to build
- **The community compounds the value** — every field trial contribution adds an edge case, an undocumented behavior, or a version-specific fix that benefits every agent querying Compact; the more developers use and contribute, the sharper the cache gets

One MCP tool call before the code gets written. No new model, no fine-tuning, no prompt engineering.

---

## Query the API

**Endpoint:** `https://gate.usecompact.dev/search`  
**Method:** `POST`  
**Auth:** `Authorization: Bearer <your-api-key>`  
**Body:** `{ "query": "how do I connect Prisma to Postgres", "limit": 3, "git_repo": "prisma/prisma" }` — default **3**; broader queries often use **5–7**.

```bash
curl -s -X POST https://gate.usecompact.dev/search \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ORACLE_API_KEY" \
  -d '{"query": "add Clerk auth to Next.js", "limit": 3}'
```

**Try it now:** shared beta key (no signup) in [BETA.md](BETA.md). Personal keys: [usecompact.dev](https://usecompact.dev). Beta terms: [BETA.md](BETA.md). API contract: [SEARCH-API.md](SEARCH-API.md).

---

## Use in your IDE (MCP)

The **Compact MCP server** exposes **`oracle_search`** (query the cache) and **`oracle_log`** (report cache misses) so Cursor, Claude Code, Gemini, and other MCP clients can use Compact before writing code and feed the learning loop.

**From this repo:**

```bash
cd mcp-server
npm install
npm run build
```

Then point your IDE’s MCP config at `mcp-server/dist/index.js` and set `ORACLE_API_KEY` (shared key in [BETA.md](BETA.md)). See [SETUP.md](SETUP.md) for all clients (Cursor, Claude, Gemini, VS Code) and [CLIENTS.md](CLIENTS.md).

**From npm (when published):**

```bash
npx oracle-knowledge-mcp
```

---

## Docs in this repo

| File | Description |
|------|-------------|
| [BETA.md](BETA.md) | Free beta details — what your key covers and what happens after beta |
| [SETUP.md](SETUP.md) | Step-by-step MCP setup for Cursor, Claude, Gemini CLI, VS Code (Copilot agent), OpenClaw |
| [SEARCH-API.md](SEARCH-API.md) | Request/response contract for the search endpoint |
| [CLIENTS.md](CLIENTS.md) | Multi-client reference (all clients, env vars, query limit) |
| [SKILL.md](SKILL.md) | OpenClaw skill (when to query Compact, how to call the API) |
| [CONTRIBUTION-SYSTEM.md](CONTRIBUTION-SYSTEM.md) | How to contribute field trials (email, web form, X) |
| [mcp-server/](mcp-server/) | MCP server source and build |

**VS Code:** Opening this repo in VS Code uses the included `.vscode/mcp.json` so the Compact MCP is ready after `npm run build` in `mcp-server/` (requires Copilot agent mode).

---

## Contribute

Every developer has debugged something that took hours and wasn’t in any docs. That knowledge belongs in Compact.

- **Email:** contribute@usecompact.dev  
- **Twitter:** tag [@usecompact](https://twitter.com/usecompact) with **#compactfieldtrial**

See [CONTRIBUTION-SYSTEM.md](CONTRIBUTION-SYSTEM.md) for what to send and how we review.
