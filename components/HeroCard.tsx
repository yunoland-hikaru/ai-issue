import Link from 'next/link';
import type { Article } from '@/types';
import { formatDateTime } from '@/lib/utils';
import { companyNameFromLogoUrl } from '@/lib/logo';
import { localePath } from '@/lib/i18n';

interface HeroCardProps {
  article: Article;
  lang?: 'ja' | 'ko' | 'en';
}

export default function HeroCard({ article, lang = 'ja' }: HeroCardProps) {
  const title = (lang === 'ko' ? article.title_ko : lang === 'en' ? article.title_en : null) ?? article.title_ja;
  const summary = (lang === 'ko' ? article.summary_ko : lang === 'en' ? article.summary_en : null) ?? article.summary_ja;
  const image = article.image_url;
  const company = companyNameFromLogoUrl(article.logo_url);

  return (
    <Link href={localePath(lang, `/news/${article.id}`)}>
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
          <h2
            className="text-lg sm:text-2xl font-bold leading-snug mb-2 sm:mb-3 group-hover:text-[var(--accent)] transition-colors"
            style={{ color: 'var(--text-1)' }}
          >
            {title}
          </h2>
          {summary && (
            <p className="text-sm sm:text-base leading-relaxed line-clamp-2 sm:line-clamp-3" style={{ color: 'var(--text-3)' }}>
              {summary}
            </p>
          )}
          <div className="flex items-center gap-2 mt-3 sm:mt-4 text-sm" style={{ color: 'var(--text-4)' }}>
            {article.logo_url && (
              <>
                <span className="inline-flex items-center gap-1.5" style={{ color: 'var(--text-3)' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={article.logo_url} alt="" className="h-4 w-4 rounded-sm object-contain" />
                  {company}
                </span>
                <span>·</span>
              </>
            )}
            <span>{formatDateTime(article.created_at, lang)}</span>
          </div>
        </div>
      </article>
    </Link>
  );
}
