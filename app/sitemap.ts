import type { MetadataRoute } from 'next';
import { getClient } from '@/lib/supabase';

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://ai-issue.com';

// 1時間ごとに再生成（記事が増えるため）
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    '', '/about', '/newsletter', '/contact', '/privacy', '/terms',
  ].map((p) => ({ url: `${SITE}${p}`, lastModified: new Date() }));

  let articleRoutes: MetadataRoute.Sitemap = [];
  try {
    const { data } = await getClient()
      .from('articles')
      .select('id, created_at')
      .order('created_at', { ascending: false })
      .limit(1000);
    articleRoutes = (data ?? []).map((a) => ({
      url: `${SITE}/news/${a.id}`,
      lastModified: new Date(a.created_at),
    }));
  } catch {
    /* Supabase未設定/失敗時は静的ルートのみ */
  }

  return [...staticRoutes, ...articleRoutes];
}
