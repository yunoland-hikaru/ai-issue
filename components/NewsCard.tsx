import Link from 'next/link';
import Image from 'next/image';
import type { Article } from '@/types';
import { formatDateTime } from '@/lib/utils';
import { companyNameFromLogoUrl } from '@/lib/logo';
import { localePath } from '@/lib/i18n';

interface NewsCardProps {
  article: Article;
  lang?: 'ja' | 'ko' | 'en';
}

export default function NewsCard({ article, lang = 'ja' }: NewsCardProps) {
  const title = lang === 'ko' ? article.title_ko : lang === 'en' ? article.title_en : article.title_ja;
  const summary = lang === 'ko' ? article.summary_ko : lang === 'en' ? article.summary_en : article.summary_ja;
  const company = companyNameFromLogoUrl(article.logo_url);

  return (
    <Link href={localePath(lang, `/news/${article.id}`)}>
      <article className="flex gap-3 py-3 sm:py-4 border-b last:border-0 group cursor-pointer" style={{ borderColor: 'var(--border-2)' }}>
        <div className="flex-1 min-w-0">
          <h3
            className="text-sm sm:text-base font-medium leading-snug mb-1 sm:mb-1.5 group-hover:text-[var(--accent)] transition-colors line-clamp-2"
            style={{ color: 'var(--text-1)' }}
          >
            {title ?? article.title_ja}
          </h3>
          {(summary ?? article.summary_ja) && (
            <p className="hidden sm:block text-sm leading-relaxed line-clamp-2" style={{ color: 'var(--text-3)' }}>
              {summary ?? article.summary_ja}
            </p>
          )}
          <div className="flex items-center gap-2 mt-1.5 sm:mt-2 text-sm" style={{ color: 'var(--text-4)' }}>
            {article.logo_url && (
              <>
                <span className="inline-flex items-center gap-1" style={{ color: 'var(--text-3)' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={article.logo_url} alt="" className="h-3.5 w-3.5 rounded-sm object-contain" />
                  {company}
                </span>
                <span>·</span>
              </>
            )}
            <span>{formatDateTime(article.created_at, lang)}</span>
          </div>
        </div>
        {article.image_url && (
          <div className="relative shrink-0 w-16 h-14 sm:w-20 sm:h-16 rounded-lg overflow-hidden">
            <Image
              src={article.image_url}
              alt={title ?? article.title_ja}
              fill
              sizes="80px"
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        )}
      </article>
    </Link>
  );
}
