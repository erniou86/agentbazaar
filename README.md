# AgentBazaar

开源 AI Agent 交易市场：开发者上架 Agent，买家搜索、发现、付费解锁。交易使用 Ed25519 签名保证不可抵赖。

## 功能
- Agent 上架与搜索（关键词 / 分类 / 热门排序）
- 详情页与评分、下载量
- 购买流程：买家私钥签名订单 → 市场验签 → 签发 license（市场私钥签名）
- **私钥永不回传**：AgentBazaar 只用自己的私钥签发凭证，买家的私钥也不会上传（仅上传公钥+签名）
- 防重放：每次购买携带唯一 `orderId`

## 快速开始
```bash
npm install
npm run seed            # 生成市场密钥对
export BAZAAR_PRIVATE_KEY=... BAZAAR_PUBLIC_KEY=...
npm run dev             # http://localhost:3000
npm test
```

## API
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/agents?q=&category=` | Agent 列表 / 搜索 |
| GET | `/api/agents/:id` | 详情 |
| POST | `/api/purchase` | 购买（验签后签发 license） |
| GET | `/health` | 健康检查（含市场公钥） |

### 购买请求体
```json
{
  "agentId": "a1",
  "buyerPubKey": "<base64 ed25519 pubkey>",
  "signature": "<base64 signature of orderId>",
  "orderId": "unique-order-001"
}
```

## License
MIT
