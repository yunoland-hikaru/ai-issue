'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { Article } from '@/types';
import { useLang } from '@/contexts/LangContext';
import { formatDateTime } from '@/lib/utils';
import { companyNameFromLogoUrl } from '@/lib/logo';
import { localePath } from '@/lib/i18n';

export default function SearchOverlay({ onClose }: { onClose: () => void }) {
  const { t, lang } = useLang();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Article[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'done'>('idle');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  // 入力をデバウンスして検索（setStateはタイマーコールバック内のみ＝effectで同期setStateしない）
  useEffect(() => {
    const q = query.trim();
    const id = setTimeout(() => {
      if (!q) { setResults([]); setStatus('idle'); return; }
      setStatus('loading');
      fetch(`/api/articles?q=${encodeURIComponent(q)}&limit=12`)
        .then((r) => r.json())
        .then((data: Article[]) => { setResults(Array.isArray(data) ? data : []); setStatus('done'); })
        .catch(() => { setResults([]); setStatus('done'); });
    }, q ? 250 : 0);
    return () => clearTimeout(id);
  }, [query]);

  return (
    <div
      className="fixed inset-0 z-[60] flex justify-center px-4 pt-20 sm:pt-28"
      style={{ background: 'rgba(0,0,0,0.45)' }}
      onMouseDown={onClose}
    >
      <div
        className="w-full max-w-xl h-fit rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: 'var(--bg-card)' }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Input row */}
        <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderColor: 'var(--border-1)' }}>
          <svg width="20" height="20" fill="none" stroke="var(--text-3)" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.search.placeholder}
            className="flex-1 bg-transparent text-base focus:outline-none"
            style={{ color: 'var(--text-1)' }}
          />
          <button onClick={onClose} aria-label="close" style={{ color: 'var(--text-3)' }}>
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto">
          {status === 'idle' && (
            <p className="px-4 py-8 text-center text-sm" style={{ color: 'var(--text-4)' }}>{t.search.hint}</p>
          )}
          {status === 'loading' && (
            <p className="px-4 py-8 text-center text-sm" style={{ color: 'var(--text-4)' }}>…</p>
          )}
          {status === 'done' && results.length === 0 && (
            <p className="px-4 py-8 text-center text-sm" style={{ color: 'var(--text-4)' }}>{t.search.noResults}</p>
          )}
          {results.map((a) => {
            const title = (lang === 'ko' ? a.title_ko : lang === 'en' ? a.title_en : null) ?? a.title_ja;
            const company = companyNameFromLogoUrl(a.logo_url);
            return (
              <Link
                key={a.id}
                href={localePath(lang, `/news/${a.id}`)}
                onClick={onClose}
                className="flex gap-3 px-4 py-3 border-b last:border-0 transition-colors hover:bg-[var(--input-bg)]"
                style={{ borderColor: 'var(--border-2)' }}
              >
                {a.image_url && (
                  <div className="relative shrink-0 w-14 h-12 rounded-lg overflow-hidden">
                    <Image src={a.image_url} alt="" fill sizes="56px" className="object-cover" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium leading-snug line-clamp-2" style={{ color: 'var(--text-1)' }}>{title}</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-4)' }}>
                    {company ? `${company} · ` : ''}{formatDateTime(a.created_at, lang)}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
