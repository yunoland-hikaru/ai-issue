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
