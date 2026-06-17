import Parser from 'rss-parser';

const parser = new Parser({
  headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AIissueBot/1.0; +https://ai-issue.com)' },
  customFields: {
    item: ['media:content', 'media:thumbnail', 'enclosure'],
  },
});

// 出典は「公開・拡散を意図した一次情報源（公式AIブログ/研究）」のみ。
// 二次ニュース媒体や「AI学習・活用禁止」を明記する媒体（旧AI Times等）は著作権リスクのため使わない。
export const RSS_SOURCES = [
  { url: 'https://openai.com/news/rss.xml', lang: 'en', name: 'OpenAI' },
  { url: 'https://deepmind.google/blog/rss.xml', lang: 'en', name: 'Google DeepMind' },
  { url: 'https://huggingface.co/blog/feed.xml', lang: 'en', name: 'Hugging Face' },
  { url: 'https://rss.arxiv.org/rss/cs.AI', lang: 'en', name: 'arXiv' },
] as const;

export interface RssItem {
  title: string;
  content: string;
  url: string;
  sourceName: string;
  publishedAt: string;
  thumbnailUrl?: string;
}

export async function fetchRssFeed(source: (typeof RSS_SOURCES)[number]): Promise<RssItem[]> {
  const feed = await parser.parseURL(source.url);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return feed.items.slice(0, 10).map((item: any) => ({
    title: item.title ?? '',
    content: item.contentSnippet ?? item.content ?? '',
    url: item.link ?? '',
    sourceName: source.name,
    publishedAt: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
    thumbnailUrl: extractThumbnail(item),
  }));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractThumbnail(item: any): string | undefined {
  const enclosure = item.enclosure as { url?: string; type?: string } | undefined;
  if (enclosure?.type?.startsWith('image/')) return enclosure.url;
  const media = item['media:content'] as { $?: { url?: string } } | undefined;
  if (media?.$?.url) return media.$.url;
  const thumb = item['media:thumbnail'] as { $?: { url?: string } } | undefined;
  if (thumb?.$?.url) return thumb.$.url;
  const match = typeof item.content === 'string'
    ? item.content.match(/<img[^>]+src="([^"]+)"/)
    : null;
  return match?.[1];
}
