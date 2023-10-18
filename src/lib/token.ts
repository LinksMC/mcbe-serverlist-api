import crypto from 'crypto';

// 環境変数が定義されていない場合のデフォルト値
const DEFAULT_TOKEN_LIFETIME = 300;
const DEFAULT_TOKEN_LENGTH = 10;

// 秒単位でトークンのライフタイムを取得
export function getTokenLifetime(): number {
  const t = Number(process.env.TOKEN_LIFETIME);
  if (t == null || isNaN(t)) {
    return DEFAULT_TOKEN_LIFETIME;
  }
  return t;
}

// トークンの長さを取得する
export function getTokenLength(): number {
  const n = Number(process.env.TOKEN_LENGTH);
  if (n == null || isNaN(n)) {
    return DEFAULT_TOKEN_LENGTH;
  }
  return n;
}

// トークンを生成する
export function CreateToken(): string {
  const S = 'abcdefghijkmnpqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ23456789';
  return Array.from(crypto.getRandomValues(new Uint32Array(getTokenLength())))
    .map((v) => S[v % S.length])
    .join('');
}
