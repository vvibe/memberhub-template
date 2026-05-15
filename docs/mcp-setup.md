# Portaly Vibe MCP Setup

MemberHub includes project-scoped Portaly Vibe MCP config for Coding Agents that can read MCP settings from the current repository.

This follows the official Portaly MCP guideline:

- Portaly Admin: `經營工具 > MCP 管理`
- Token action: `建立 MCP Token`
- Token format: similar to `mcp_ptly_xxxxxxxx`
- MCP package: `@portaly-ai/portaly-mcp`
- Agent env var: `PORTALY_API_TOKEN`

The MCP token is a real Portaly access token for AI-assisted product operations. It is not a payment sandbox key, and it should never be committed to GitHub.

## Included Files

- `.mcp.json` for project-local MCP clients such as Claude Code local scope and compatible agents.
- `.cursor/mcp.json` for Cursor project MCP.

Both files define the same project-scoped MCP server:

```json
{
  "mcpServers": {
    "portaly-vibe": {
      "command": "npx",
      "args": ["-y", "@portaly-ai/portaly-mcp"],
      "env": {
        "PORTALY_API_TOKEN": "mcp_ptly_xxx"
      }
    }
  }
}
```

Before using it, replace `mcp_ptly_xxx` locally with the MCP token issued from Portaly Admin.

## Recommended Local Setup

1. Go to Portaly Admin > `經營工具 > MCP 管理`.
2. Create an MCP Token.
3. Copy the token into your local MCP config or agent secret store.
4. Restart the Coding Agent.
5. Ask: `你可以使用 Portaly MCP 嗎？列出目前可用的工具。`
6. If the agent lists tools such as `listProducts`, `createProduct`, or product update tools, the connection is ready.

If your Coding Agent supports environment or secret interpolation in MCP config, prefer that instead of placing the token directly in `.mcp.json`. If you need a local-only config file, copy the project config to `.mcp.local.json` or `.cursor/mcp.local.json`; both are ignored by Git.

Use project scope, not user/global scope, when your agent supports it. The intent is that this MCP server belongs to the forked MemberHub project.

## What Portaly MCP Is Used For

Portaly MCP lets the Coding Agent help operate Portaly product setup through natural language, such as:

- Create products.
- List existing products.
- Get one product's details.
- Update product title, price, and description.
- Enable or disable products.

For MemberHub, use it after the local app and InsForge setup are ready, so the agent can help create or review the product/payment items that match the selected site mode.

## What It Is Not

- It is not the browser-side public key.
- It is not a throwaway test key.
- It is not a secret that should appear in README examples, screenshots, commits, issue comments, or chat.
- It does not replace the optional checkout callback security settings. Payment callbacks still need `PORTALY_CALLBACK_SECRET`, trusted origins, and webhook verification if payment functions are enabled.
