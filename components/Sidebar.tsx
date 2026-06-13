'use client';

import { useState } from 'react';
import type { Tool, TrendingKeyword } from '@/types';
import { useLang } from '@/contexts/LangContext';
import ToolCard from './ToolCard';

interface SidebarProps {
  tools: Tool[];
  keywords: TrendingKeyword[];
}

export default function Sidebar({ tools, keywords }: SidebarProps) {
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
      if (res.ok) {
        setStatus('done');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  }

  return (
    <aside className="w-full lg:w-72 lg:shrink-0 space-y-4 sm:space-y-5">
      <section className="rounded-2xl p-4" style={{ background: '#1a1a2e' }}>
        <h2 className="text-sm font-bold text-white mb-3">{t.sections.todayTools}</h2>
        <div>
          {tools.map((tool) => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </div>
      </section>

      <section className="rounded-2xl p-4" style={{ background: '#1a1a2e' }}>
        <h2 className="text-sm font-bold text-white mb-3">{t.sections.trending}</h2>
        <ol className="space-y-2">
          {keywords.map((kw, i) => (
            <li key={kw.id} className="flex items-center gap-3 cursor-pointer group">
              <span
                className="w-5 text-center text-xs font-bold"
                style={{ color: i < 3 ? '#7F77DD' : 'rgba(255,255,255,0.3)' }}
              >
                {i + 1}
              </span>
              <span className="text-sm text-white/70 group-hover:text-[#7F77DD] transition-colors flex-1">
                {kw.keyword}
              </span>
              <span className="text-xs text-white/30">{kw.count.toLocaleString()}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="rounded-2xl p-4" style={{ background: '#1a1a2e' }}>
        <h2 className="text-sm font-bold text-white mb-1">{t.sections.newsletter}</h2>
        <p className="text-xs text-white/50 mb-3">{t.sections.newsletterDesc}</p>
        {status === 'done' ? (
          <p className="text-xs text-green-400">{t.sections.newsletterThanks}</p>
        ) : (
          <form onSubmit={handleSubscribe} className="flex flex-col gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t.sections.newsletterPlaceholder}
              className="w-full rounded-lg px-3 py-2 text-sm text-white bg-white/5 border border-white/10 focus:outline-none focus:border-[#7F77DD] placeholder-white/25"
              required
              disabled={status === 'loading'}
            />
            {status === 'error' && (
              <p className="text-xs text-red-400">エラーが発生しました。再度お試しください。</p>
            )}
            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full py-2 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ background: '#7F77DD', color: '#fff' }}
            >
              {status === 'loading' ? '...' : t.sections.newsletterButton}
            </button>
          </form>
        )}
      </section>
    </aside>
  );
}
