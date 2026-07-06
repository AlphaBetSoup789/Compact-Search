# Compact — Search API Contract

Single contract for all consumers: MCP server, OpenClaw, scripts, and any HTTP client.

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
  "release_version": null
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `query` | string | Yes | Natural language or keyword search. |
| `limit` | number | No | Max results. **Default: 3** (token-efficient). **Broader** “walk me through” queries often need **5–7**. Narrow/targeted queries: **1–3**. Avoid 10 — wastes tokens. |
| `git_repo` | string | No | Filter by repository slug (e.g. `prisma/prisma`) or, for LLM cards, the model's `provider/model-id` (e.g. `anthropic/claude-opus-4.8`). |
| `feed_type` | string | No | Filter by content type. See **Content types** below. Omit to search across all types. |
| `release_version` | string | No | **Exact match** on the stored `release_version` string (e.g. `7.8.0`, `16.3.0-canary.77`, `main`). **Omit** to search all cached versions for that repo and return the best semantic match (usually the latest extracted). Do **not** pass a major-only string like `"14"` unless a prior hit showed that exact value — it will return zero matches. MCP `version` maps here. |

---

## Content types (`feed_type`)

Compact indexes more than library docs. Pass `feed_type` to scope a query:

| `feed_type` | Content | Example query |
|---|---|---|
| `oracle` | Third-party API/library docs — install steps, config, code snippets (default corpus) | `"connect Prisma to Postgres"` |
| `llm-card` | Structured LLM model cards — pricing, context window, benchmarks, capabilities, privacy tier | `"best coding model under $5 per 1M output tokens"` |
| `design-md` | Curated design-system / UI style references | `"minimal SaaS dashboard design style"` |
| `curated` | Hand-filled gap records for known documentation blind spots | — |
| `field_trial` | Community-contributed edge cases and undocumented behavior | — |

For `llm-card` results, `git_repo` is the model's `provider/model-id` (e.g. `openai/gpt-5.5`, `xai/grok-4.3`) and `structured_payload` contains `pricing`, `limits`, `capabilities`, `benchmarks`, and `task_fit` objects — see [domains/llm/expansion/LLM.md](https://github.com/AlphaBetSoup789/compact-pipeline) in the pipeline repo for the full schema.

---

## Response

### Success (200)

```json
{
  "matches": [
    {
      "id": "uuid",
      "source_url": "https://...",
      "git_repo": "prisma/prisma",
      "release_version": "5.22.0",
      "feed_type": "oracle",
      "summary": "Connect Prisma to PostgreSQL using connection URL...",
      "search_text_snippet": "...",
      "structured_payload": { ... }
    }
  ]
}
```

Return at least `source_url`, `summary` (from `structured_payload.summary`), and optionally full `structured_payload` for procedures and code. Trim large payloads if needed for token limits.

### Error (4xx/5xx)

```json
{
  "error": "message"
}
```

---

## Notes

- **`release_version` filter (exact match):** The gate RPC compares `release_version = filter_version` literally. Passing `"14"` does **not** match `14.2.1` or `16.3.0-canary.77`. **Default: omit `release_version`** and use `git_repo` when you know the library. Only pass `release_version` when re-querying with an exact string from a previous hit's `release_version` field.
- **MCP `oracle_search`:** Defaults `limit` to **3**; agents may pass **5–7** for broader tasks. The tool exposes a `version` argument; the MCP server maps it to `release_version` in this request body. Same rule: omit `version` unless you have an exact cached string.
- **Wire response:** The n8n gate may return `[{ "query", "count", "matches" }]` (array) rather than a bare `{ "matches" }` object. Unwrap the first element if needed.

---

## Log endpoint (operator / internal only)

**Not exposed via public MCP.** `oracle_log` was removed from the agent-facing tool list because untrusted agents must not write to `query_log`.

Operators and internal automations may POST cache misses to `https://gate.usecompact.dev/log`. Gap tracking for curation: `compact-pipeline/oracle-kit/COMPACT-CACHE-GAPS.md`.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `query` | string | Yes | Query that failed or was low value. |
| `git_repo` | string | No | Library/repo if known. |
| `reason` | string | No | e.g. `no_results`, `outdated`, `wrong_version`, `low_confidence`. |
| `source` | string | No | Caller id (e.g. `mcp`, `openclaw`). |
| `timestamp` | string | No | ISO-8601; server may default if omitted. |

Auth: `Authorization: Bearer <your-api-key>` — required (same as search).
