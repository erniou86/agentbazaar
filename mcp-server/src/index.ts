/**
 * AgentBazaar MCP Server
 *
 * Exposes AgentBazaar (open-source AI agent marketplace) to any MCP client:
 * Claude Desktop, Cursor, Marvis, etc. Tools:
 *   - search_agents: search the marketplace by keyword / category
 *   - get_agent: get agent detail by id
 *   - purchase_agent: purchase an agent (Ed25519 signed license)
 *
 * Usage:
 *   npm install
 *   npm run build
 *   npx agentbazaar-mcp   # stdio transport
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ToolSchema,
} from '@modelcontextprotocol/sdk/types.js';
import nacl from 'tweetnacl';
import naclUtil from 'tweetnacl-util';

const { encodeBase64, decodeBase64 } = naclUtil;

// ---- 内置 Agent 目录（demo 数据，生产可接 AgentBazaar HTTP API）----
interface Agent {
  id: string;
  name: string;
  description: string;
  price: number; // unit: 0.001 ETH
  category: string;
  rating: number;
  downloads: number;
}

const AGENTS: Agent[] = [
  { id: 'a1', name: 'BlogWriter Pro', description: 'AI 博客写作助手：SEO 优化、多平台适配、一键成稿', price: 50, category: 'writing', rating: 4.8, downloads: 320 },
  { id: 'a2', name: 'DataScraper', description: '网页数据采集 Agent：动态页面、反爬绕过、结构化输出', price: 80, category: 'data', rating: 4.6, downloads: 210 },
  { id: 'a3', name: 'CodeReviewer', description: '代码审查 Agent：安全扫描、性能分析、规范检查', price: 60, category: 'dev', rating: 4.9, downloads: 450 },
  { id: 'a4', name: 'EmailAssistant', description: '邮件助手：自动分类、回复草稿、日程提取', price: 30, category: 'productivity', rating: 4.5, downloads: 180 },
  { id: 'a5', name: 'MCPConnector', description: 'MCP 服务连接器：快速接入第三方 MCP 工具链', price: 45, category: 'dev', rating: 4.7, downloads: 150 },
];

function findAgent(id: string): Agent | undefined {
  return AGENTS.find((a) => a.id === id);
}

function searchAgents(q: string, category: string): Agent[] {
  const kw = (q || '').toLowerCase();
  return AGENTS.filter((a) => {
    if (category && a.category !== category) return false;
    if (!kw) return true;
    return (
      a.name.toLowerCase().includes(kw) ||
      a.description.toLowerCase().includes(kw)
    );
  });
}

// ---- Ed25519 签名工具（与 AgentBazaar 主服务一致）----
const BAZAAR_PRIV = process.env.BAZAAR_PRIVATE_KEY || encodeBase64(nacl.sign.keyPair().secretKey);
const BAZAAR_PUB = process.env.BAZAAR_PUBLIC_KEY || encodeBase64(nacl.sign.keyPair().publicKey);

function sign(msg: string, privB64: string): string {
  const priv = decodeBase64(privB64);
  const sig = nacl.sign.detached(new TextEncoder().encode(msg), priv);
  return encodeBase64(sig);
}

function verify(msg: string, sigB64: string, pubB64: string): boolean {
  try {
    const sig = decodeBase64(sigB64);
    const pub = decodeBase64(pubB64);
    return nacl.sign.detached.verify(new TextEncoder().encode(msg), sig, pub);
  } catch {
    return false;
  }
}

// ---- MCP Server ----
const server = new Server(
  { name: 'agentbazaar-mcp', version: '1.0.0' },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'search_agents',
      description: '搜索 AgentBazaar 市场的 AI Agent，按关键词或分类筛选',
      inputSchema: {
        type: 'object',
        properties: {
          q: { type: 'string', description: '搜索关键词（agent 名称或描述）' },
          category: { type: 'string', description: '分类筛选：writing/data/dev/productivity' },
        },
      },
    },
    {
      name: 'get_agent',
      description: '获取单个 Agent 的详细信息',
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Agent ID，如 a1' },
        },
        required: ['id'],
      },
    },
    {
      name: 'purchase_agent',
      description: '购买 Agent：买家对 orderId 签名，市场验签后签发 license',
      inputSchema: {
        type: 'object',
        properties: {
          agentId: { type: 'string', description: 'Agent ID' },
          buyerPubKey: { type: 'string', description: '买家 Ed25519 公钥（base64）' },
          signature: { type: 'string', description: '对 orderId 的 Ed25519 签名（base64）' },
          orderId: { type: 'string', description: '唯一订单号（防重放）' },
        },
        required: ['agentId', 'buyerPubKey', 'signature', 'orderId'],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  try {
    switch (name) {
      case 'search_agents': {
        const q = String(args?.q || '');
        const category = String(args?.category || '');
        const agents = searchAgents(q, category);
        return {
          content: [{ type: 'text', text: JSON.stringify({ count: agents.length, agents }, null, 2) }],
        };
      }
      case 'get_agent': {
        const id = String(args?.id || '');
        const agent = findAgent(id);
        if (!agent) {
          return { content: [{ type: 'text', text: JSON.stringify({ error: 'agent not found' }) }], isError: true };
        }
        return { content: [{ type: 'text', text: JSON.stringify(agent, null, 2) }] };
      }
      case 'purchase_agent': {
        const { agentId, buyerPubKey, signature, orderId } = args as Record<string, string>;
        if (!agentId || !buyerPubKey || !signature || !orderId) {
          return { content: [{ type: 'text', text: JSON.stringify({ error: 'missing fields' }) }], isError: true };
        }
        const agent = findAgent(agentId);
        if (!agent) {
          return { content: [{ type: 'text', text: JSON.stringify({ error: 'agent not found' }) }], isError: true };
        }
        if (!verify(orderId, signature, buyerPubKey)) {
          return { content: [{ type: 'text', text: JSON.stringify({ error: 'invalid signature' }) }], isError: true };
        }
        const license = {
          ok: true,
          orderId,
          agentId,
          buyerPubKey,
          issuedAt: new Date().toISOString(),
          marketPubKey: BAZAAR_PUB,
          signature: sign(`${orderId}|${agentId}|${buyerPubKey}`, BAZAAR_PRIV),
        };
        return { content: [{ type: 'text', text: JSON.stringify(license, null, 2) }] };
      }
      default:
        return { content: [{ type: 'text', text: `unknown tool: ${name}` }], isError: true };
    }
  } catch (e: any) {
    return { content: [{ type: 'text', text: `error: ${e?.message || e}` }], isError: true };
  }
});

// stdio 启动
const transport = new StdioServerTransport();
await server.connect(transport);
console.error('AgentBazaar MCP server running on stdio');
