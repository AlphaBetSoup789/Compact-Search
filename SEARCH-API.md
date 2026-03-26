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
  "limit": 5,
  "git_repo": null,
  "feed_type": null,
  "release_version": null
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `query` | string | Yes | Natural language or keyword search. |
| `limit` | number | No | Max results. **Recommendation:** 1–3 for targeted queries, 3–7 for broad "walk me through" queries. Default 3. Avoid 10 — wastes tokens. Callers can set per preference. |
| `git_repo` | string | No | Filter by repository slug (e.g. `prisma/prisma`). |
| `feed_type` | string | No | Filter by `feed_type` (e.g. `oracle`). |
| `release_version` | string | No | Filter by version. Use prefix match so "15" matches 15, 15.x, 15.2.1. Prefer major-only. |

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

- **`release_version` filter:** Use prefix match — `"15"` matches `15`, `15.x`, `15.2.1`. Prefer major-only unless you need a specific minor.
- **MCP `oracle_search`:** The tool exposes a `version` argument; the MCP server maps it to `release_version` in this request body.

---

## Log endpoint (cache misses)

Used by the MCP tool `oracle_log` and by OpenClaw when configured. URL: `https://gate.usecompact.dev/log`.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `query` | string | Yes | Query that failed or was low value. |
| `git_repo` | string | No | Library/repo if known. |
| `reason` | string | No | e.g. `no_results`, `outdated`, `wrong_version`, `low_confidence`. |
| `source` | string | No | Caller id (e.g. `mcp`, `openclaw`). |
| `timestamp` | string | No | ISO-8601; server may default if omitted. |

Auth: `Authorization: Bearer <your-api-key>` — required (same as search).
