'use client';

import Link from 'next/link';
import type { Article } from '@/types';
import { useLang } from '@/contexts/LangContext';
import { localePath } from '@/lib/i18n';

interface MostPopularProps {
  articles: Article[];
}

export default function MostPopular({ articles }: MostPopularProps) {
  const { t, lang } = useLang();
  const items = articles.slice(0, 10);

  return (
    <section className="rounded-2xl p-4" style={{ background: 'var(--bg-card)' }}>
      <h2 className="text-base font-extrabold tracking-widest mb-3" style={{ color: 'var(--text-1)' }}>
        {t.sections.mostPopular}
      </h2>
      {items.length === 0 ? (
        <p className="text-sm py-2" style={{ color: 'var(--text-4)' }}>—</p>
      ) : (
        <ol className="space-y-2.5">
          {items.map((a, i) => {
            const title = (lang === 'ko' ? a.title_ko : lang === 'en' ? a.title_en : null) ?? a.title_ja;
            const top3 = i < 3;
            return (
              <li key={a.id}>
                <Link href={localePath(lang, `/news/${a.id}`)} className="flex items-start gap-2.5 group">
                  <span
                    className="shrink-0 flex items-center justify-center text-sm font-bold mt-0.5"
                    style={
                      top3
                        ? { width: 20, height: 20, borderRadius: 6, background: 'var(--accent)', color: '#fff' }
                        : { width: 20, height: 20, color: 'var(--text-4)' }
                    }
                  >
                    {i + 1}
                  </span>
                  <span
                    className="text-sm leading-snug line-clamp-2 group-hover:text-[var(--accent)] transition-colors"
                    style={{ color: 'var(--text-2)' }}
                  >
                    {title}
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
