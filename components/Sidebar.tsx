'use client';

import { useState } from 'react';
import type { Article } from '@/types';
import { useLang } from '@/contexts/LangContext';
import MostPopular from './MostPopular';

interface SidebarProps {
  popular: Article[];
}

export default function Sidebar({ popular }: SidebarProps) {
  const { t } = useLang();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');

  async function handleSubscribe(e: React.FormEvent) {
    e.preventDefault();
    if (!email || status === 'loading') return;
    setStatus('loading');
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      setStatus(res.ok ? 'done' : 'error');
    } catch {
      setStatus('error');
    }
  }

  return (
    <aside className="w-full lg:w-72 lg:shrink-0 space-y-4 sm:space-y-5">
      {/* Newsletter — 最上部 */}
      <section className="rounded-2xl p-4" style={{ background: 'var(--bg-card)' }}>
        <h2 className="text-base font-bold mb-1" style={{ color: 'var(--text-1)' }}>{t.sections.newsletter}</h2>
        <p className="text-sm mb-3" style={{ color: 'var(--text-3)' }}>{t.sections.newsletterDesc}</p>
        {status === 'done' ? (
          <p className="text-sm text-green-500">{t.sections.newsletterThanks}</p>
        ) : (
          <form onSubmit={handleSubscribe} className="flex flex-col gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t.sections.newsletterPlaceholder}
              className="w-full rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              style={{
                color: 'var(--text-1)',
                background: 'var(--input-bg)',
                border: '1px solid var(--border-1)',
              }}
              required
              disabled={status === 'loading'}
            />
            {status === 'error' && (
              <p className="text-sm text-red-500">エラーが発生しました。再度お試しください。</p>
            )}
            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full py-2 rounded-lg text-base font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ background: 'var(--accent)', color: '#fff' }}
            >
              {status === 'loading' ? '...' : t.sections.newsletterButton}
            </button>
          </form>
        )}
      </section>

      {/* MOST POPULAR — 閲覧数ランキング */}
      <MostPopular articles={popular} />
    </aside>
  );
}
