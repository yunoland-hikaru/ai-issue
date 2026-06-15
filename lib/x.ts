import { TwitterApi } from 'twitter-api-v2';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://ai-issue.com';

// カテゴリ別ハッシュタグ（英語ポスト用）。
const HASHTAGS: Record<string, string> = {
  'AI産業': '#AI #TechNews',
  'AI技術': '#AI #MachineLearning',
  '規制・政策': '#AI #AIPolicy',
};

// OAuth 1.0a（ボットアカウントのユーザートークン）。env未設定なら null（→ skip）。
function xClient(): TwitterApi | null {
  const { X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_SECRET } = process.env;
  if (!X_API_KEY || !X_API_SECRET || !X_ACCESS_TOKEN || !X_ACCESS_SECRET) return null;
  return new TwitterApi({
    appKey: X_API_KEY,
    appSecret: X_API_SECRET,
    accessToken: X_ACCESS_TOKEN,
    accessSecret: X_ACCESS_SECRET,
  });
}

export function isXConfigured(): boolean {
  return xClient() !== null;
}

interface TweetArticle {
  id: string;
  category: string;
  titleEn?: string | null;
  titleJa: string;
}

// 「タイトル + ハッシュタグ + リンク(/en/news/...)」。280字に収まるようタイトルを切り詰める。
// リンクは t.co で常に23字換算、リンクページのOG/Twitterカードで画像が自動表示される。
export function buildTweet(a: TweetArticle): string {
  const tags = HASHTAGS[a.category] || '#AI';
  const url = `${SITE_URL}/en/news/${a.id}`;
  const title = (a.titleEn || a.titleJa || '').trim();
  const reserved = 23 /* link */ + 1 /* \n */ + tags.length + 2 /* \n\n */;
  const maxTitle = 280 - reserved;
  const t = title.length > maxTitle ? `${title.slice(0, maxTitle - 1)}…` : title;
  return `${t}\n\n${tags}\n${url}`;
}

/** 記事をXへポスト。best-effort（env未設定/失敗でも例外は投げず結果を返す）。 */
export async function postArticleToX(a: TweetArticle): Promise<{ ok: boolean; error?: string }> {
  const client = xClient();
  if (!client) return { ok: false, error: 'X not configured' };
  try {
    await client.v2.tweet(buildTweet(a));
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'tweet failed' };
  }
}
