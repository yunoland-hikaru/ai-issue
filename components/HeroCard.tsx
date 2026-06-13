import Link from 'next/link';
import type { Article } from '@/types';
import { CATEGORY_STYLES } from '@/lib/categoryStyles';
import { formatRelativeTime } from '@/lib/utils';

interface HeroCardProps {
  article: Article;
  lang?: 'ja' | 'ko' | 'en';
}

export default function HeroCard({ article, lang = 'ja' }: HeroCardProps) {
  const style = CATEGORY_STYLES[article.category] ?? CATEGORY_STYLES['AI産業'];
  const title = (lang === 'ko' ? article.title_ko : lang === 'en' ? article.title_en : null) ?? article.title_ja;
  const summary = (lang === 'ko' ? article.summary_ko : lang === 'en' ? article.summary_en : null) ?? article.summary_ja;
  const image = article.image_url ?? article.thumbnail_url;

  return (
    <Link href={`/news/${article.id}`}>
      <article className="relative rounded-2xl overflow-hidden group cursor-pointer" style={{ background: 'var(--bg-card)' }}>
        {image && (
          <div className="relative h-44 sm:h-56 md:h-64 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          </div>
        )}
        <div className="p-4 sm:p-5">
          <span
            className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full mb-2 sm:mb-3"
            style={{ background: style.bg, color: style.text }}
          >
            {article.category}
          </span>
          <h2
            className="text-base sm:text-xl font-bold leading-snug mb-2 sm:mb-3 group-hover:text-[#7F77DD] transition-colors"
            style={{ color: 'var(--text-1)' }}
          >
            {title}
          </h2>
          {summary && (
            <p className="text-xs sm:text-sm leading-relaxed line-clamp-2 sm:line-clamp-3" style={{ color: 'var(--text-3)' }}>
              {summary}
            </p>
          )}
          <div className="flex items-center gap-2 mt-3 sm:mt-4 text-xs" style={{ color: 'var(--text-4)' }}>
            <span>{article.source_name}</span>
            <span>·</span>
            <span>{formatRelativeTime(article.published_at)}</span>
          </div>
        </div>
      </article>
    </Link>
  );
}
