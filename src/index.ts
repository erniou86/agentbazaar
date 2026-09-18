import Fastify from 'fastify';
import cors from '@fastify/cors';
import nacl from 'tweetnacl';
import naclUtil from 'tweetnacl-util';
const { decodeBase64, encodeBase64 } = naclUtil;
import { listAgents, getAgent, recordDownload } from './store.js';
import type { LicenseResponse, PurchaseRequest } from './types.js';

const app = Fastify({ logger: true });
await app.register(cors, { origin: true });

// AgentBazaar 自身密钥对（生产环境通过环境变量注入；未配置时自动生成 demo 密钥）
const { BAZAAR_PRIV, BAZAAR_PUB } = (() => {
  const kp = nacl.sign.keyPair();
  return {
    BAZAAR_PRIV: process.env.BAZAAR_PRIVATE_KEY || encodeBase64(kp.secretKey),
    BAZAAR_PUB: process.env.BAZAAR_PUBLIC_KEY || encodeBase64(kp.publicKey),
  };
})();

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

app.get('/health', async () => ({ ok: true, pubKey: BAZAAR_PUB }));

app.get<{ Querystring: { q?: string; category?: string } }>('/api/agents', async (req) => {
  return { agents: listAgents(req.query.q, req.query.category) };
});

app.get<{ Params: { id: string } }>('/api/agents/:id', async (req, reply) => {
  const agent = getAgent(req.params.id);
  if (!agent) return reply.code(404).send({ error: 'agent not found' });
  return agent;
});

// 购买：买家用自己私钥对 orderId 签名，AgentBazaar 验签通过后签发 license
app.post<{ Body: PurchaseRequest }>('/api/purchase', async (req, reply) => {
  const { agentId, buyerPubKey, signature, orderId } = req.body ?? {};
  if (!agentId || !buyerPubKey || !signature || !orderId) {
    return reply.code(400).send({ error: 'missing fields' });
  }
  if (!verify(orderId, signature, buyerPubKey)) {
    return reply.code(401).send({ error: 'invalid signature' });
  }
  const agent = getAgent(agentId);
  if (!agent) return reply.code(404).send({ error: 'agent not found' });
  recordDownload(agentId);

  // 支付结算（此处接入 ETH 合约地址后替换为链上校验）
  // 签发 license：AgentBazaar 私钥签名，全程不回传私钥
  const license: LicenseResponse = {
    ok: true,
    orderId,
    agentId,
    buyerPubKey,
    issuedAt: new Date().toISOString(),
    signature: sign(orderId + '|' + agentId + '|' + buyerPubKey, BAZAAR_PRIV),
  };
  return license;
});

const port = Number(process.env.PORT || 3000);
app.listen({ port, host: '0.0.0.0' }, (err) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
});
