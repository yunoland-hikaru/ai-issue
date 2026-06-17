// ニックネームの検証ルール（モーダルとマイページで共通）。
// - 2〜15文字
// - 記号（特殊文字）・空白は不可。Unicodeの「文字」と「数字」のみ許可（日本語・韓国語・英数字OK）。
export const NICKNAME_MIN = 2;
export const NICKNAME_MAX = 15;
const NICKNAME_RE = /^[\p{L}\p{N}]+$/u;

export function isValidNickname(v: string): boolean {
  return v.length >= NICKNAME_MIN && v.length <= NICKNAME_MAX && NICKNAME_RE.test(v);
}

// 自動入力候補などを規則に合わせて整形（不許可文字を除去し、最大長で切る）。
export function sanitizeNickname(v: string): string {
  return v.replace(/[^\p{L}\p{N}]/gu, '').slice(0, NICKNAME_MAX);
}
