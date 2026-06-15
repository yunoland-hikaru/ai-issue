import type { MetadataRoute } from 'next';

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://ai-issue.com';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: [`${SITE}/sitemap.xml`, `${SITE}/news-sitemap.xml`],
    host: SITE,
  };
}
