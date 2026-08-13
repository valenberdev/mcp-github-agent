import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createRepositoryTool } from "./tools/create-repository.js";
import { createIssueTool } from "./tools/create-issue.js";
import { listRepositoriesTool } from "./tools/list-repositories.js";
import { createCommitTool } from "./tools/create-commit.js";
import { listIssuesTool } from "./tools/list-issues.js";

function adaptHandler(handler: (args: any) => Promise<any>) {
  return async (args: any) => {
    const result = await handler(args);
    return {
      content: [{ type: "text", text: JSON.stringify(result) }],
    };
  };
}

const server = new McpServer({
  name: "valenberdev-github-agent",
  version: "0.1.0",
});

const tools = [createRepositoryTool, createIssueTool, listRepositoriesTool, createCommitTool, listIssuesTool];

for (const tool of tools) {
  (server.tool as any)(
    tool.name,
    tool.description,
    tool.inputSchema,
    adaptHandler(tool.handler)
  );
}

const transport = new StdioServerTransport();
await server.connect(transport);