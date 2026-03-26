#!/usr/bin/env node
/**
 * Compact — MCP Server
 * usecompact.dev
 *
 * Exposes search over versioned, procedural docs (Stripe, Supabase, Prisma, etc.).
 * Env: ORACLE_SEARCH_API_URL, ORACLE_LOG_API_URL (optional defaults to production),
 *      ORACLE_API_KEY or ORACLE_SEARCH_API_KEY (optional Bearer + X-API-Key).
 * Logging: console.error only (stdio is used for MCP protocol).
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const SEARCH_API_URL =
  process.env.ORACLE_SEARCH_API_URL || "https://gate.usecompact.dev/search";
const LOG_API_URL =
  process.env.ORACLE_LOG_API_URL || "https://gate.usecompact.dev/log";
const API_KEY =
  process.env.ORACLE_SEARCH_API_KEY || process.env.ORACLE_API_KEY || "";

function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  if (API_KEY) {
    headers["Authorization"] = `Bearer ${API_KEY}`;
    headers["X-API-Key"] = API_KEY;
  }
  return headers;
}

const server = new McpServer({
  name: "compact",
  version: "1.1.0",
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
    const data = (await res.json()) as { matches?: unknown[]; error?: string };
    if (!res.ok) {
      return { error: data?.error || res.statusText || `HTTP ${res.status}` };
    }
    return data;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Compact: search API request failed:", msg);
    return { error: msg };
  }
}

async function callLogApi(body: {
  query: string;
  git_repo?: string | null;
  reason?: string;
  source?: string;
  timestamp?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...authHeaders(),
  };
  try {
    const res = await fetch(LOG_API_URL, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      let errText = res.statusText || `HTTP ${res.status}`;
      try {
        const data = (await res.json()) as { error?: string };
        if (data?.error) errText = data.error;
      } catch {
        /* ignore */
      }
      return { ok: false, error: errText };
    }
    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Compact: log API request failed:", msg);
    return { ok: false, error: msg };
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
      "Compact: versioned, procedural docs for third-party APIs and libraries (Stripe, Supabase, Prisma, Next.js, Auth.js, Drizzle, Zod, 70+). Use before generating integration code. Returns exact procedures, code snippets, prerequisites, and common errors. Less context, better code.",
    inputSchema: {
      query: z.string().describe("Natural language or keyword search (e.g. 'How to connect Prisma to Postgres')"),
      limit: z.number().min(1).max(20).optional().default(5).describe("Max number of results (default 5)"),
      git_repo: z.string().optional().describe("Filter by repo e.g. prisma/prisma"),
      version: z
        .string()
        .optional()
        .describe("Major or prefix version filter (sent as release_version; e.g. 14, 15.2)"),
    },
  },
  async ({ query, limit, git_repo, version }) => {
    const result = await callSearchApi({
      query,
      limit,
      git_repo: git_repo || undefined,
      release_version: version || undefined,
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

server.registerTool(
  "oracle_log",
  {
    description:
      "Log a Compact cache miss or low-confidence result (feeds the learning loop). Call when oracle_search returned nothing useful or was wrong for a third-party library.",
    inputSchema: {
      query: z.string().describe("The search query that failed or was insufficient"),
      git_repo: z.string().optional().describe("Library repo if known, e.g. prisma/prisma"),
      reason: z
        .enum(["no_results", "outdated", "wrong_version", "low_confidence"])
        .optional()
        .default("no_results")
        .describe("Why logging"),
      source: z.string().optional().default("mcp").describe("Caller identifier (default mcp)"),
      timestamp: z
        .string()
        .optional()
        .describe("ISO-8601 time; omit to use server-side default"),
    },
  },
  async ({ query, git_repo, reason, source, timestamp }) => {
    const result = await callLogApi({
      query,
      git_repo: git_repo || undefined,
      reason,
      source,
      timestamp,
    });
    if (!result.ok) {
      return {
        content: [{ type: "text" as const, text: `Log failed: ${result.error}` }],
      };
    }
    return {
      content: [{ type: "text" as const, text: "Logged successfully." }],
    };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Compact MCP server running on stdio (oracle_search, oracle_log)");
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
