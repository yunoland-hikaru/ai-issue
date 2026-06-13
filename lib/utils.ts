export function formatRelativeTime(dateStr: string): string {
  // Ensure the string is parsed as UTC (append Z if no timezone info)
  const normalized = /[Z+\-]\d*$/.test(dateStr.trim()) ? dateStr : dateStr + 'Z';
  const diff = Date.now() - new Date(normalized).getTime();

  // Future-dated articles (clock skew, RSS delays) → show "たった今"
  if (diff < 0) return 'たった今';

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
