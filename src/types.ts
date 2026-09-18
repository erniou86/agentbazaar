export interface Agent {
  id: string;
  name: string;
  description: string;
  price: number; // 单位: 0.001 ETH
  category: string;
  rating: number;
  downloads: number;
  createdAt: string;
}

export interface PurchaseRequest {
  agentId: string;
  buyerPubKey: string;   // Ed25519 公钥（hex）
  signature: string;     // 对 orderId 的签名（hex）
  orderId: string;       // 唯一订单号（防重放）
}

export interface LicenseResponse {
  ok: true;
  orderId: string;
  agentId: string;
  buyerPubKey: string;
  issuedAt: string;
  signature: string;     // AgentBazaar 私钥签名（不泄露私钥本身）
}
