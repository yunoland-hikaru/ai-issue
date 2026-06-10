import Parser from 'rss-parser';

const parser = new Parser({
  customFields: {
    item: ['media:content', 'media:thumbnail', 'enclosure'],
  },
});

export const RSS_SOURCES = [
  { url: 'https://www.aitimes.com/rss/allArticle.xml', lang: 'ko', name: 'AI Times' },
  { url: 'https://techcrunch.com/feed/', lang: 'en', name: 'TechCrunch' },
  { url: 'https://venturebeat.com/feed/', lang: 'en', name: 'VentureBeat' },
  { url: 'https://www.theverge.com/rss/ai-artificial-intelligence/index.xml', lang: 'en', name: 'The Verge' },
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
