// 企業ドメインから無料ロゴURLを組み立てる。
// LOGODEV_TOKEN があれば logo.dev（高解像度・鮮明）、無ければ DuckDuckGo アイコンにフォールバック。
// 報道目的での企業ロゴ利用（指名的フェアユース）。特定企業がなければ null。
// logo.dev の publishable トークン(pk_...)は公開前提なのでURLに含めてOK。
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

  const token = process.env.LOGODEV_TOKEN;
  if (token) {
    // size=256 + retina で鮮明。fallback=monogram で未収録時は頭文字アイコン。
    return `https://img.logo.dev/${host}?token=${token}&size=256&retina=true&format=png&fallback=monogram`;
  }
  return `https://icons.duckduckgo.com/ip3/${host}.ico`;
}
