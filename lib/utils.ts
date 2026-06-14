import type { Language } from '@/types';

const EN_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** 記事時刻を「年月日 時分」(JST固定)で表示。言語別フォーマット。 */
export function formatDateTime(dateStr: string, lang: Language = 'ja'): string {
  if (!dateStr) return '';
  const normalized = /Z$|[+\-]\d{2}:?\d{2}$/.test(dateStr.trim()) ? dateStr : dateStr + 'Z';
  const ms = new Date(normalized).getTime();
  if (Number.isNaN(ms)) return '';
  // 英語のみUTC、それ以外はJST(=KST, UTC+9)で表示。
  const offsetMs = lang === 'en' ? 0 : 9 * 60 * 60 * 1000;
  const z = new Date(ms + offsetMs);
  const Y = z.getUTCFullYear();
  const M = z.getUTCMonth() + 1;
  const D = z.getUTCDate();
  const hh = String(z.getUTCHours()).padStart(2, '0');
  const mm = String(z.getUTCMinutes()).padStart(2, '0');
  if (lang === 'ko') return `${Y}년 ${M}월 ${D}일 ${hh}:${mm}`;
  if (lang === 'en') return `${EN_MONTHS[M - 1]} ${D}, ${Y} ${hh}:${mm} UTC`;
  return `${Y}年${M}月${D}日 ${hh}:${mm}`;
}

export function formatRelativeTime(dateStr: string): string {
  if (!dateStr) return 'たった今';
  // Append Z only when no timezone info present (+09:00, +0900, Z forms are all covered)
  const normalized = /Z$|[+\-]\d{2}:?\d{2}$/.test(dateStr.trim()) ? dateStr : dateStr + 'Z';
  // 生成直後の記事は「0分前」と出したいので、軽微なクロックスキューは0にクランプ
  const diff = Math.max(0, Date.now() - new Date(normalized).getTime());

  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}分前`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}時間前`;

  // Format as "6月13日" in JST (UTC+9)
  const jst = new Date(new Date(normalized).getTime() + 9 * 60 * 60 * 1000);
  const m = jst.getUTCMonth() + 1;
  const d = jst.getUTCDate();
  return `${m}月${d}日`;
}
