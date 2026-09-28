# AgentBazaar MCP Server

将 AgentBazaar 开源 AI Agent 市场接入任意 MCP 客户端（Claude Desktop / Cursor / Marvis / VS Code 等）。

## 工具

| 工具 | 说明 |
|---|---|
| `search_agents` | 按关键词/分类搜索 Agent |
| `get_agent` | 获取 Agent 详情 |
| `purchase_agent` | 购买 Agent（Ed25519 验签后签发 license） |

## 快速开始

```bash
npm install
npm run build
npx agentbazaar-mcp
```

## MCP 客户端配置

Claude Desktop `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "agentbazaar": {
      "command": "npx",
      "args": ["agentbazaar-mcp"]
    }
  }
}
```

## 上架说明

本 MCP server 可上架 MCP Marketplace / MCPize / Apify 等平台（85% 分成），作为 AgentBazaar 的流量入口与变现渠道。

## License

MIT License，详见 [LICENSE](../LICENSE)。
