import Link from 'next/link';
import type { Article } from '@/types';
import { CATEGORY_STYLES } from '@/lib/categoryStyles';
import { formatRelativeTime } from '@/lib/utils';

interface NewsCardProps {
  article: Article;
  lang?: 'ja' | 'ko' | 'en';
}

export default function NewsCard({ article, lang = 'ja' }: NewsCardProps) {
  const style = CATEGORY_STYLES[article.category] ?? CATEGORY_STYLES['AI産業'];
  const title = lang === 'ko' ? article.title_ko : lang === 'en' ? article.title_en : article.title_ja;
  const summary = lang === 'ko' ? article.summary_ko : lang === 'en' ? article.summary_en : article.summary_ja;

  return (
    <Link href={`/news/${article.id}`}>
      <article className="flex gap-4 py-4 border-b border-white/5 last:border-0 group cursor-pointer">
        <div className="flex-1 min-w-0">
          <span
            className="inline-block text-xs font-semibold px-2 py-0.5 rounded-full mb-2"
            style={{ background: style.bg, color: style.text }}
          >
            {article.category}
          </span>
          <h3 className="text-sm font-medium text-white leading-snug mb-1.5 group-hover:text-[#7F77DD] transition-colors line-clamp-2">
            {title ?? article.title_ja}
          </h3>
          {(summary ?? article.summary_ja) && (
            <p className="text-xs text-white/50 leading-relaxed line-clamp-2">
              {summary ?? article.summary_ja}
            </p>
          )}
          <div className="flex items-center gap-2 mt-2 text-xs text-white/30">
            <span>{article.source_name}</span>
            <span>·</span>
            <span>{formatRelativeTime(article.published_at)}</span>
          </div>
        </div>
        {article.thumbnail_url && (
          <div className="shrink-0 w-20 h-16 rounded-lg overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={article.thumbnail_url}
              alt=""
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        )}
      </article>
    </Link>
  );
}
