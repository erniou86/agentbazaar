// 生成一对 Ed25519 密钥并打印，用于本地测试
import nacl from 'tweetnacl';
import { encodeBase64 } from 'tweetnacl-util';

const pair = nacl.sign.keyPair();
console.log('PUBLIC_KEY =', encodeBase64(pair.publicKey));
console.log('PRIVATE_KEY =', encodeBase64(pair.secretKey));
console.log('export BAZAAR_PUBLIC_KEY=<PUBLIC_KEY>');
console.log('export BAZAAR_PRIVATE_KEY=<PRIVATE_KEY>');
