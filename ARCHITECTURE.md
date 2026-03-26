# Compact — Architecture & Internal Design

This document covers the internal design decisions, data flows, and response
shapes for contributors and anyone building a new Compact client.

---

## System overview

```
Client (Cursor / Claude Code / OpenClaw)
  ↓ oracle_search({ query, limit, git_repo, version })  →  oracle_log({ ... }) on miss
MCP Server (index.js)
  ↓ POST { query, limit, git_repo, release_version }
Gate (gate.usecompact.dev)
  ↓ validate API key, forward to search backend
Search Backend
  ↓ semantic search over knowledge cache
  ↑ { query, count, matches: [...] }
MCP Server
  ↑ formatted markdown to agent
```

---

## Gate request shape

All clients call the gate. The gate validates the API key and forwards to the backend.

```
POST https://gate.usecompact.dev/search
Content-Type: application/json
Authorization: Bearer <api-key>

{
  "query":    "set up Shadcn UI in Next.js",  // required
  "limit":    3,                               // optional; default 3 — use 5–7 for broader queries
  "git_repo": "shadcn-ui/ui",                 // optional, owner/repo filter
  "release_version": "14"                     // optional, prefix match (MCP tool arg: version)
}
```

---

## Response shape

```json
{
  "query": "set up Shadcn UI in Next.js",
  "count": 3,
  "matches": [
    {
      "rank": 1,
      "similarity": "85%",
      "git_repo": "shadcn-ui/ui",
      "release_version": "latest",
      "source_url": "apps/v4/content/docs/installation/next.mdx",
      "summary": "Initialize shadcn/ui in a new Next.js project...",
      "procedure": [
        {
          "step_number": 1,
          "intent": "Create a new Next.js project with shadcn/ui",
          "actionable_instruction": "Run npx shadcn@latest init -t next",
          "code_snippet": "npx shadcn@latest init -t next",
          "file_path": null
        }
      ],
      "prerequisites": ["Node.js and npx available"],
      "common_errors": [],
      "created_at": "2026-03-15T23:05:35.799681+00:00",
      "raw_payload": { }
    }
  ]
}
```

### Critical: fields are TOP-LEVEL on each match

Fields like `summary`, `procedure`, `prerequisites`, and `common_errors` are
returned **top-level on each match object** — they are NOT nested under
`structured_payload`. The `raw_payload` field contains the full
`structured_payload` object for clients that need it.

When building a client, always use this fallback chain:

```javascript
let sp = m.structured_payload ?? m.raw_payload ?? m;
if (typeof sp === 'string') {
  try { sp = JSON.parse(sp); } catch { sp = {}; }
}

const summary      = sp.summary      ?? m.summary      ?? m.search_text ?? '';
const procedure    = sp.procedure    ?? m.procedure    ?? [];
const prerequisites = sp.prerequisites ?? m.prerequisites ?? [];
const common_errors = sp.common_errors ?? m.common_errors ?? [];
```

### Similarity is a string

`similarity` is returned as a percentage string (`"85%"`) not a float.
To compare numerically:

```javascript
const simNum = typeof m.similarity === 'number'
  ? m.similarity
  : parseFloat(String(m.similarity)) / 100;
```

---

## MCP server configuration (reference implementation)

| Env var | Default | Description |
|---|---|---|
| `ORACLE_SEARCH_API_URL` | Production search URL | Search endpoint |
| `ORACLE_LOG_API_URL` | Production log URL | Log endpoint for `oracle_log` |
| `ORACLE_API_KEY` | `""` | Bearer + `X-API-Key` when set |
| `ORACLE_SEARCH_API_KEY` | `""` | Same as `ORACLE_API_KEY`; wins if both are set |

The bundled MCP server registers **oracle_search** and **oracle_log** and does not implement client-side similarity filtering. For custom clients, you may still apply a soft threshold (see below).

### Similarity threshold guidance (custom clients)

Use `0.75` as the minimum. The threshold is a soft signal not a hard filter:
- Above `0.80` — use result directly
- `0.75–0.80` — use as a guide, add a note that results may not be exact
- Below `0.75` — drop and fall back to training knowledge

Do not set above `0.83`. Higher thresholds cause silent drops where you pay
the token cost to fetch results then discard them client-side.

### Default limit

The public MCP server defaults `limit` to **3** (saves tokens). For **broader** “walk me through” queries, use **5–7** so adjacent procedures (e.g. init + add-component) can surface. Narrow/targeted queries: **1–3**. See [SEARCH-API.md](SEARCH-API.md).

---

## Source conventions

**GitHub repos:** `git_repo = "owner/repo"`  
**Doc sites:** `git_repo = "docs.domain.com"`  
**Field trials:** `source_url = "field-trial/YYYY-MM-DD"` — treated as authoritative; not replaced by automated imports from official docs.

---

## Adding a new client

1. POST to `https://gate.usecompact.dev/search` with `Authorization: Bearer <api-key>`
2. Parse response using the fallback chain above
3. Handle `similarity` as a string percentage
4. Use `MIN_SIMILARITY = 0.75` as the soft threshold
5. Default `limit = 3`; use **5–7** for broad queries when building a custom client
6. Log cache misses to `https://gate.usecompact.dev/log` (see [SEARCH-API.md § Log endpoint](SEARCH-API.md#log-endpoint-cache-misses))

See `CLIENTS.md` for per-client configuration examples.
