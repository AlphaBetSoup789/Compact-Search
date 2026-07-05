#!/usr/bin/env node
/**
 * Compact — MCP Server (Self-hosted HTTP entrypoint)
 *
 * Serves the MCP server over Streamable HTTP transport.
 * The Compact API key is passed per-session via the X-Config-OracleApiKey
 * header only (no query-param or env fallback — see security fix history).
 */

import { createServer as createHttpServer } from "node:http";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import createMcpServer from "./index.js";

const PORT = parseInt(process.env.PORT || "8080", 10);

const httpServer = createHttpServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://localhost:${PORT}`);

  // Health check
  if (req.method === "GET" && url.pathname === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok", server: "compact-mcp" }));
    return;
  }

  // MCP endpoint
  if (url.pathname === "/mcp") {
    // Extract config from header only (no query-param or env fallback)
    const oracleApiKey =
      (req.headers["x-config-oracleapikey"] as string) || "";

    // Allow requests without API key for tool discovery (Smithery scanning).
    // Tool execution will fail gracefully if no key is provided.

    try {
      const server = createMcpServer({
        config: { oracleApiKey },
        env: process.env as Record<string, string>,
      });

      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined, // stateless
      });

      res.on("close", () => server.close());
      await server.connect(transport);
      await transport.handleRequest(req, res);
    } catch (err) {
      console.error("MCP request error:", err);
      if (!res.headersSent) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Internal server error" }));
      }
    }
    return;
  }

  // Root / info
  if (req.method === "GET" && (url.pathname === "/" || url.pathname === "")) {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      name: "Compact Knowledge MCP",
      version: "1.2.0",
      description: "Versioned procedural docs for 70+ APIs and libraries, plus LLM model cards (pricing/benchmarks) and design-system style references. Less context, better code.",
      mcp_endpoint: "/mcp",
      docs: "https://usecompact.dev",
    }));
    return;
  }

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Not found" }));
});

httpServer.listen(PORT, () => {
  console.error(`Compact MCP HTTP server listening on port ${PORT}`);
  console.error(`MCP endpoint: http://localhost:${PORT}/mcp`);
});
