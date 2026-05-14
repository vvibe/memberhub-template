# Portaly Vibe MCP Setup

MemberHub includes project-scoped MCP config for Coding Agents that can read MCP settings from the current repository.

Included files:

- `.mcp.json` for project-local MCP clients such as Claude Code local scope and compatible agents.
- `.cursor/mcp.json` for Cursor project MCP.

Both files define the same HTTP MCP server:

```json
{
  "mcpServers": {
    "portaly-vibe": {
      "type": "http",
      "url": "https://mcp.portaly.ai",
      "headers": {
        "Authorization": "Bearer <YOUR_TOKEN>"
      }
    }
  }
}
```

Before using it, replace `<YOUR_TOKEN>` with the token issued by Portaly Vibe.

Do not commit a real token. If your Coding Agent supports environment or secret interpolation in MCP headers, prefer using that agent's local secret mechanism. If you need a local-only file, copy the config to `.mcp.local.json` or `.cursor/mcp.local.json`; both are ignored by Git.

Use project scope, not user/global scope, when your agent supports it. The intent is that this MCP server belongs to the forked MemberHub project.
