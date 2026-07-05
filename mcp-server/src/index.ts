#!/usr/bin/env node
/**
 * Compact — MCP Server (Smithery Hosted HTTP)
 * usecompact.dev
 *
 * Exposes search over versioned, procedural docs (Stripe, Supabase, Prisma, etc.),
 * structured LLM model cards (pricing, benchmarks, capabilities — feed_type: llm-card),
 * and curated design-system / UI style references (feed_type: design-md).
 * Deployed as a Smithery-hosted remote server; config (API key) is injected per session.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { ServerContext } from "@smithery/sdk";

const DEFAULT_SEARCH_URL = "https://gate.usecompact.dev/search";

export const configSchema = z.object({
  oracleApiKey: z
    .string()
    .describe("Your Compact API key. Free beta key at usecompact.dev."),
});

export default function createServer({
  config,
  env,
}: ServerContext<z.infer<typeof configSchema>>) {
  const apiKey = config.oracleApiKey;
  const SEARCH_API_URL = env?.ORACLE_SEARCH_API_URL || process.env.ORACLE_SEARCH_API_URL || DEFAULT_SEARCH_URL;

  function authHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};
    if (apiKey) {
      headers["Authorization"] = `Bearer ${apiKey}`;
      headers["X-API-Key"] = apiKey;
    }
    return headers;
  }

  const server = new McpServer({
    name: "compact",
    version: "1.2.1",
  });

  async function callSearchApi(body: {
    query: string;
    limit?: number;
    git_repo?: string | null;
    feed_type?: string | null;
    release_version?: string | null;
  }): Promise<{ matches?: unknown[]; error?: string }> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...authHeaders(),
    };
    try {
      const res = await fetch(SEARCH_API_URL, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });
      const raw = await res.json();
      // Unwrap array wrapper if present (API returns [{...}])
      const unwrapped = Array.isArray(raw) && raw.length > 0 ? raw[0] : raw;
      const data = unwrapped as { matches?: unknown[]; error?: string };
      if (!res.ok) {
        return { error: data?.error || res.statusText || `HTTP ${res.status}` };
      }
      return { matches: data.matches ?? [], error: data.error };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("Compact: search API request failed:", msg);
      return { error: msg };
    }
  }

  function pickSummary(m: Record<string, unknown>): string {
    let sp = (m.structured_payload ?? m.raw_payload ?? m) as Record<string, unknown> | string;
    if (typeof sp === "string") {
      try {
        sp = JSON.parse(sp) as Record<string, unknown>;
      } catch {
        sp = {};
      }
    }
    if (typeof sp !== "object" || sp === null) sp = {};
    const s = sp as Record<string, unknown>;
    return String(
      s.summary ?? m.summary ?? m.search_text ?? m.search_text_snippet ?? ""
    );
  }

  function formatMatches(matches: unknown[]): string {
    if (!Array.isArray(matches) || matches.length === 0) {
      return "No matches found.";
    }
    const lines: string[] = [];
    matches.forEach((m, i) => {
      const r = m as Record<string, unknown>;
      const summary = pickSummary(r);
      const source = r?.source_url ?? "";
      const repo = r?.git_repo ?? "";
      const sim = r?.similarity != null ? ` (${r.similarity})` : "";
      lines.push(`${i + 1}. ${repo} ${source}${sim}`);
      lines.push(`   ${summary}`);
      lines.push("");
    });
    return lines.join("\n").trim();
  }

  server.registerTool(
    "oracle_search",
    {
      description:
        "Compact: versioned, procedural docs for third-party APIs and libraries (Stripe, Supabase, Prisma, Next.js, Auth.js, Drizzle, Zod, 70+). Also covers structured LLM model cards — pricing, context windows, benchmarks, capabilities, privacy tier (feed_type: llm-card) — for picking a model for a task or comparing cost/performance, and curated design-system / UI style references (feed_type: design-md) for visual/brand direction. Use before generating integration code, before recommending an LLM, or before proposing a UI style. Returns exact procedures, code snippets, prerequisites, and common errors. Less context, better code.",
      inputSchema: {
        query: z.string().describe("Natural language or keyword search (e.g. 'How to connect Prisma to Postgres', 'best model for coding agents under $5/1M output', 'minimal SaaS dashboard design style')"),
        limit: z
          .number()
          .min(1)
          .max(20)
          .optional()
          .default(3)
          .describe("Max results (default 3). Use 5–7 for broader walk-through queries; avoid 10."),
        git_repo: z.string().optional().describe("Filter by repo/slug e.g. prisma/prisma, or an LLM's provider/model-id e.g. anthropic/claude-opus-4.8"),
        version: z
          .string()
          .optional()
          .describe("Major or prefix version filter (sent as release_version; e.g. 14, 15.2)"),
        feed_type: z
          .enum(["oracle", "llm-card", "design-md", "curated", "field_trial"])
          .optional()
          .describe("Filter by content type: 'oracle' = library/API docs (default corpus), 'llm-card' = LLM model pricing/benchmarks/capabilities, 'design-md' = UI/design-system style references, 'curated' = hand-filled gap records, 'field_trial' = community-contributed edge cases. Omit to search across all types."),
      },
    },
    async ({ query, limit, git_repo, version, feed_type }) => {
      const result = await callSearchApi({
        query,
        limit,
        git_repo: git_repo || undefined,
        release_version: version || undefined,
        feed_type: feed_type || undefined,
      });
      if (result.error) {
        return {
          content: [{ type: "text" as const, text: `Search failed: ${result.error}` }],
        };
      }
      const matches = result.matches ?? [];
      const text = formatMatches(matches);
      return {
        content: [{ type: "text" as const, text }],
      };
    }
  );

  return server.server;
}
