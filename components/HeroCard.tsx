import Link from 'next/link';
import type { Article } from '@/types';
import { CATEGORY_STYLES } from '@/lib/categoryStyles';
import { formatRelativeTime } from '@/lib/utils';

interface HeroCardProps {
  article: Article;
}

export default function HeroCard({ article }: HeroCardProps) {
  const style = CATEGORY_STYLES[article.category] ?? CATEGORY_STYLES['AI産業'];

  return (
    <Link href={`/news/${article.id}`}>
      <article className="relative rounded-2xl overflow-hidden group cursor-pointer" style={{ background: '#1a1a2e' }}>
        {article.thumbnail_url && (
          <div className="relative h-44 sm:h-56 md:h-64 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={article.thumbnail_url}
              alt={article.title_ja}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a2e] via-[#1a1a2e]/40 to-transparent" />
          </div>
        )}
        <div className="p-4 sm:p-5">
          <span
            className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full mb-2 sm:mb-3"
            style={{ background: style.bg, color: style.text }}
          >
            {article.category}
          </span>
          <h2 className="text-base sm:text-xl font-bold text-white leading-snug mb-2 sm:mb-3 group-hover:text-[#7F77DD] transition-colors">
            {article.title_ja}
          </h2>
          {article.summary_ja && (
            <p className="text-white/60 text-xs sm:text-sm leading-relaxed line-clamp-2 sm:line-clamp-3">
              {article.summary_ja}
            </p>
          )}
          <div className="flex items-center gap-2 mt-3 sm:mt-4 text-xs text-white/40">
            <span>{article.source_name}</span>
            <span>·</span>
            <span>{formatRelativeTime(article.published_at)}</span>
          </div>
        </div>
      </article>
    </Link>
  );
}
