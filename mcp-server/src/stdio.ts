#!/usr/bin/env node
/**
 * Compact — MCP Server (stdio entrypoint)
 *
 * Standalone CLI wrapper for local/npm usage. Imports the Smithery factory
 * and connects it to a stdio transport with ORACLE_API_KEY from env.
 */

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import createServer from "./index.js";

const apiKey = process.env.ORACLE_SEARCH_API_KEY || process.env.ORACLE_API_KEY || "";

const server = createServer({ config: { oracleApiKey: apiKey }, env: process.env as Record<string, string> });
const transport = new StdioServerTransport();

server.connect(transport).then(() => {
  console.error("Compact MCP server running on stdio (oracle_search, oracle_log)");
}).catch((err: unknown) => {
  console.error("Fatal:", err);
  process.exit(1);
});
