// 企業ドメインから無料ロゴURLを組み立てる（DuckDuckGoアイコン: キー不要）。
// 報道目的での企業ロゴ利用（指名的フェアユース）。特定企業がなければ null。
// より高解像度のロゴが必要になったら logo.dev トークン版に差し替え可能。
export function logoUrlForDomain(domain: string | null | undefined): string | null {
  if (!domain) return null;
  // "https://openai.com/" や "www.openai.com" などを素のホスト名に正規化
  const host = domain
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/.*$/, '');
  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(host)) return null;
  return `https://icons.duckduckgo.com/ip3/${host}.ico`;
}
