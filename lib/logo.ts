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

// 主要AI企業は正式表記をマッピング（ドメイン素朴な大文字化だと OpenAI→Openai 等になるため）
const BRAND_NAMES: Record<string, string> = {
  'openai.com': 'OpenAI',
  'anthropic.com': 'Anthropic',
  'nvidia.com': 'NVIDIA',
  'meta.com': 'Meta',
  'google.com': 'Google',
  'deepmind.com': 'DeepMind',
  'microsoft.com': 'Microsoft',
  'apple.com': 'Apple',
  'amazon.com': 'Amazon',
  'x.ai': 'xAI',
  'mistral.ai': 'Mistral AI',
  'huggingface.co': 'Hugging Face',
};

// logo.dev / DuckDuckGo どちらのURL形式からもドメインを抽出
export function domainFromLogoUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  return url.match(/ip3\/([^/]+?)\.ico/)?.[1] ?? url.match(/img\.logo\.dev\/([^/?]+)/)?.[1] ?? null;
}

// バッジ表示用の企業名（マッピングがあればそれ、無ければ先頭ラベルを大文字化）
export function companyNameFromLogoUrl(url: string | null | undefined): string | null {
  const domain = domainFromLogoUrl(url);
  if (!domain) return null;
  if (BRAND_NAMES[domain]) return BRAND_NAMES[domain];
  const label = domain.split('.')[0];
  return label.charAt(0).toUpperCase() + label.slice(1);
}
