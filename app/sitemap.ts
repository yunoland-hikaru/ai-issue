import type { MetadataRoute } from 'next';
import { getClient } from '@/lib/supabase';
import { LOCALES } from '@/lib/i18n';

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://ai-issue.com';

// 1時間ごとに再生成（記事が増えるため）
export const revalidate = 3600;

// 1つのパスを全ロケール分のエントリ＋hreflang alternatesに展開。
function localizedEntries(path: string, lastModified: Date): MetadataRoute.Sitemap {
  const languages: Record<string, string> = {};
  for (const l of LOCALES) languages[l] = `${SITE}/${l}${path}`;
  return LOCALES.map((l) => ({
    url: `${SITE}/${l}${path}`,
    lastModified,
    alternates: { languages },
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticPaths = ['', '/about', '/newsletter', '/contact', '/privacy', '/terms'];
  const staticRoutes = staticPaths.flatMap((p) => localizedEntries(p, now));

  let articleRoutes: MetadataRoute.Sitemap = [];
  try {
    const { data } = await getClient()
      .from('articles')
      .select('id, created_at')
      .order('created_at', { ascending: false })
      .limit(1000);
    articleRoutes = (data ?? []).flatMap((a) =>
      localizedEntries(`/news/${a.id}`, new Date(a.created_at)),
    );
  } catch {
    /* Supabase未設定/失敗時は静的ルートのみ */
  }

  return [...staticRoutes, ...articleRoutes];
}
