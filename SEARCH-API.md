# Compact — Search API Contract

Single contract for all consumers: MCP server, OpenClaw, scripts, and any HTTP client.

---

## Agent guidance

### When to query oracle

Query BEFORE any third-party integration code, INCLUDING before installing/scaffolding a new dependency. Trigger is behavioral, not a fixed library list:

- The library/service isn't already available locally (no bundled version-matched docs in node_modules, no project AGENTS.md section for it) → query oracle.
- You are about to install or initialize a library and don't yet know current version, install command, or recent breaking changes → query oracle FIRST, before running install.
- Your training data suggests a pattern — treat that as a signal to VERIFY current version/API, not confirm it. Training data skews toward older, possibly EOL versions.
- Auth, payments, DB, deploy patterns with external deps.

Do NOT query when local version-matched docs already exist for the installed version — prefer those.

Other feeds: `llm-card` for model selection, `design-md` for UI direction.

### Version handling

Omit `release_version` by default — the RPC does **exact match**, not major/prefix. Only pass an exact `release_version` string from a prior hit. MCP `version` maps here.

### EOL awareness

If `structured_payload.eol_status` is `eol`, or training data points to a suspected EOL version, do not build on that pattern — verify current supported version. Use `include_eol: true` only for migration/upgrade-path queries.

---

## Endpoint

| Field | Value |
|-------|--------|
| **URL** | `https://gate.usecompact.dev/search` |
| **Method** | `POST` (query in body) |
| **Auth** | `Authorization: Bearer <your-api-key>` — required. Get a key at [usecompact.dev](https://usecompact.dev). |

---

## Request

### Body (JSON)

```json
{
  "query": "How do I connect Prisma to Postgres?",
  "limit": 3,
  "git_repo": null,
  "feed_type": null,
  "release_version": null,
  "include_eol": false
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `query` | string | Yes | Natural language or keyword search. |
| `limit` | number | No | Max results. **Default: 3**. Broader queries: **5–7**. Avoid 10. |
| `git_repo` | string | No | Filter by repository slug or LLM `provider/model-id`. |
| `feed_type` | string | No | `oracle`, `llm-card`, `design-md`, `curated`, `field_trial`. Omit for all types. |
| `release_version` | string | No | **Exact match** on stored version. **Omit** for best semantic match across cached versions. |
| `include_eol` | boolean | No | Default `false`. When `false`, rows with `eol_status = 'eol'` are excluded from search. Set `true` for upgrade/migration queries. |

---

## Content types (`feed_type`)

| `feed_type` | Content | Example query |
|---|---|---|
| `oracle` | Library/API docs | `"connect Prisma to Postgres"` |
| `llm-card` | LLM model cards | `"best coding model under $5 per 1M output tokens"` |
| `design-md` | Design-system references | `"minimal SaaS dashboard design style"` |
| `curated` | Hand-filled gap records | — |
| `field_trial` | Community edge cases | — |

---

## Response

### Success (200)

Wire format from n8n gate is typically an array:

```json
[
  {
    "query": "...",
    "count": 3,
    "matches": [
      {
        "rank": 1,
        "similarity": "85%",
        "git_repo": "prisma/prisma",
        "release_version": "7.8.0",
        "source_url": "...",
        "summary": "...",
        "procedure": [],
        "raw_payload": { "eol_status": "current" }
      }
    ]
  }
]
```

Unwrap the first element if needed. MCP clients handle this automatically.

### Error (4xx/5xx)

```json
{ "error": "message" }
```

---

## Notes

- **MCP `oracle_search`:** Defaults `limit` to **3**. Maps `version` → `release_version`. Optional `include_eol` (default false).

---

## Log endpoint (operator / internal only)

**Not exposed via public MCP.**

Operators may POST cache misses to `https://gate.usecompact.dev/log`. Gap tracking: `compact-pipeline/oracle-kit/COMPACT-CACHE-GAPS.md`.

Auth: `Authorization: Bearer <your-api-key>` — required (same as search).
