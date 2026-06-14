'use client';

import Link from 'next/link';
import type { Article } from '@/types';
import { useLang } from '@/contexts/LangContext';
import MostPopular from './MostPopular';

interface SidebarProps {
  popular: Article[];
}

export default function Sidebar({ popular }: SidebarProps) {
  const { t } = useLang();

  return (
    <aside className="w-full lg:w-72 lg:shrink-0 space-y-4 sm:space-y-5">
      {/* Newsletter — 最上部。申込フォームページへ誘導 */}
      <section className="rounded-2xl p-4" style={{ background: 'var(--bg-card)' }}>
        <h2 className="text-base font-bold mb-1" style={{ color: 'var(--text-1)' }}>{t.sections.newsletter}</h2>
        <p className="text-sm mb-3" style={{ color: 'var(--text-3)' }}>{t.sections.newsletterDesc}</p>
        <Link
          href="/newsletter"
          className="block w-full py-2 rounded-lg text-base font-semibold text-center transition-opacity hover:opacity-90"
          style={{ background: 'var(--accent)', color: '#fff' }}
        >
          {t.sections.newsletterButton}
        </Link>
      </section>

      {/* MOST POPULAR — 閲覧数ランキング */}
      <MostPopular articles={popular} />
    </aside>
  );
}
