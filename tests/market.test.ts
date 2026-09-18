import { describe, it, expect } from 'vitest';
import nacl from 'tweetnacl';
import { encodeBase64, decodeBase64 } from 'tweetnacl-util';
import { listAgents, getAgent, recordDownload } from '../src/store';

function sign(msg: string, priv: Uint8Array): string {
  return encodeBase64(nacl.sign.detached(new TextEncoder().encode(msg), priv));
}

describe('AgentBazaar store', () => {
  it('列出并搜索 agents', () => {
    expect(listAgents().length).toBe(5);
    expect(listAgents('review').length).toBe(1);
    expect(listAgents('', 'data').length).toBe(1);
  });

  it('按 id 获取 agent', () => {
    expect(getAgent('a1')?.name).toBe('Code Reviewer');
    expect(getAgent('nope')).toBeUndefined();
  });

  it('记录下载量', () => {
    const before = getAgent('a1')?.downloads ?? 0;
    recordDownload('a1');
    expect(getAgent('a1')?.downloads).toBe(before + 1);
  });
});

describe('Ed25519 签名', () => {
  it('验证签名可被校验', () => {
    const pair = nacl.sign.keyPair();
    const msg = 'order-123';
    const sig = sign(msg, pair.secretKey);
    const ok = nacl.sign.detached.verify(
      new TextEncoder().encode(msg),
      decodeBase64(sig),
      pair.publicKey,
    );
    expect(ok).toBe(true);

    const bad = nacl.sign.detached.verify(
      new TextEncoder().encode('order-124'),
      decodeBase64(sig),
      pair.publicKey,
    );
    expect(bad).toBe(false);
  });
});
