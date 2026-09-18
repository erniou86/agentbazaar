# AgentBazaar

开源 AI Agent 交易市场：开发者上架 Agent，买家搜索、发现、付费解锁，交易使用 Ed25519 签名保证不可抵赖。
**适用人群**：AI Agent 开发者、提示词/工作流创作者，以及希望自建可信 Agent 商店的团队。

## 功能特性

- Agent 上架与搜索（关键词 / 分类 / 热门排序）
- 详情页与评分、下载量
- 购买流程：买家私钥签名订单 → 市场验签 → 签发 license（市场私钥签名）
- **私钥永不回传**：AgentBazaar 只用自己的私钥签发凭证，买家私钥也不上传（仅上传公钥+签名）
- 防重放：每次购买携带唯一 `orderId`

## 技术栈与目录结构

**技术栈**：TypeScript / Fastify / tweetnacl（Ed25519）/ Vitest / tsx

```
agentbazaar/
├── src/
│   ├── index.ts     # 入口（Fastify 服务）
│   ├── store.ts     # 内存存储
│   ├── seed.ts      # 生成市场密钥对
│   └── types.ts     # 类型定义
├── tests/
│   └── market.test.ts   # 单元测试
├── package.json
└── tsconfig.json
```

## 快速开始

```bash
npm install
npm run seed            # 生成市场密钥对
# 可选：设置环境变量（不设置时自动生成匹配密钥对）
export BAZAAR_PRIVATE_KEY=... BAZAAR_PUBLIC_KEY=...
npm run dev             # http://localhost:3000
npm test                # 运行测试
```

**购买请求体**

```json
{
  "agentId": "a1",
  "buyerPubKey": "<base64 ed25519 pubkey>",
  "signature": "<base64 signature of orderId>",
  "orderId": "unique-order-001"
}
```

**部署说明**：`npm run build`（tsc）后可用 `npm start` 运行；无环境变量时自动生成匹配的 Ed25519 密钥对，生产环境建议通过 `BAZAAR_PRIVATE_KEY` / `BAZAAR_PUBLIC_KEY` 显式注入。

## 验证状态

引用 AI Factory 全套件验证报告（[VERIFICATION.md](../../VERIFICATION.md)，2026-09-18，Windows 11 / Node v22.14.0），本机已完成端到端运行验证：

- `npm run build`（tsc）：exit 0
- `npx vitest run`：4/4 通过（tests/market.test.ts）
- 端到端冒烟（tsx 启动 + HTTP 实测）：
  - GET /health -> 200
  - GET /api/agents -> 5 个 Agent
  - 搜索 review -> 命中 1 个
  - POST /api/purchase（Ed25519 签名购买）-> 200，license 签名 88 字符
  - license 验签 -> PASS（Ed25519 detached 验签通过）
  - 错误签名（签名与 orderId 不匹配）-> 401 正确拒绝
  - 购买后下载计数更新
- 修复记录：tweetnacl-util CJS 命名导出不兼容（改默认导入）、默认占位密钥无效（改为无环境变量时自动生成匹配密钥对）

## API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/agents?q=&category=` | Agent 列表 / 搜索 |
| GET | `/api/agents/:id` | 详情 |
| POST | `/api/purchase` | 购买（验签后签发 license） |
| GET | `/health` | 健康检查（含市场公钥） |

## License

MIT License，详见 [LICENSE](LICENSE)。本项目代码与文档由 AI 辅助生成，仅供参考与学习使用。

## 支持项目

如果这个项目对你有帮助，欢迎赞助支持持续开发：

[![PayPal](https://img.shields.io/badge/Donate-PayPal-00457C?style=flat-square&logo=paypal)](https://paypal.me/Junlong439)
