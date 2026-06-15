'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { Article } from '@/types';
import { useLang } from '@/contexts/LangContext';
import { formatDateTime } from '@/lib/utils';
import { companyNameFromLogoUrl } from '@/lib/logo';
import { localePath } from '@/lib/i18n';

/** ナビバー内のインライン検索ボックス（虫眼鏡内蔵 + 入力直下に結果ドロップダウン）。デスクトップ向け。 */
export default function SearchBox() {
  const { t, lang } = useLang();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Article[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'done'>('idle');
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  // 外側クリックで閉じる
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  // デバウンス検索（setStateはタイマー内のみ）
  useEffect(() => {
    const q = query.trim();
    const id = setTimeout(() => {
      if (!q) { setResults([]); setStatus('idle'); return; }
      setStatus('loading');
      fetch(`/api/articles?q=${encodeURIComponent(q)}&limit=8`)
        .then((r) => r.json())
        .then((data: Article[]) => { setResults(Array.isArray(data) ? data : []); setStatus('done'); })
        .catch(() => { setResults([]); setStatus('done'); });
    }, q ? 250 : 0);
    return () => clearTimeout(id);
  }, [query]);

  const showDropdown = open && query.trim().length > 0;

  return (
    <div ref={boxRef} className="relative">
      <div
        className="flex items-center gap-2 rounded-full px-3 py-1.5"
        style={{ background: 'var(--input-bg)', border: '1px solid var(--border-1)' }}
      >
        <svg width="16" height="16" fill="none" stroke="var(--text-3)" strokeWidth="2" viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
        </svg>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder={t.search.placeholder}
          className="bg-transparent text-sm w-44 lg:w-60 focus:outline-none"
          style={{ color: 'var(--text-1)' }}
          aria-label={t.nav.search}
        />
        {query && (
          <button onClick={() => setQuery('')} aria-label="clear" style={{ color: 'var(--text-4)' }}>
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {showDropdown && (
        <div
          className="absolute right-0 mt-2 w-80 rounded-2xl overflow-hidden shadow-xl border z-50"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border-1)' }}
        >
          <div className="max-h-[70vh] overflow-y-auto">
            {status === 'loading' && (
              <p className="px-4 py-6 text-center text-sm" style={{ color: 'var(--text-4)' }}>…</p>
            )}
            {status === 'done' && results.length === 0 && (
              <p className="px-4 py-6 text-center text-sm" style={{ color: 'var(--text-4)' }}>{t.search.noResults}</p>
            )}
            {results.map((a) => {
              const title = (lang === 'ko' ? a.title_ko : lang === 'en' ? a.title_en : null) ?? a.title_ja;
              const company = companyNameFromLogoUrl(a.logo_url);
              return (
                <Link
                  key={a.id}
                  href={localePath(lang, `/news/${a.id}`)}
                  onClick={() => { setOpen(false); setQuery(''); }}
                  className="flex gap-3 px-4 py-3 border-b last:border-0 transition-colors hover:bg-[var(--input-bg)]"
                  style={{ borderColor: 'var(--border-2)' }}
                >
                  {a.image_url && (
                    <div className="relative shrink-0 w-12 h-10 rounded-md overflow-hidden">
                      <Image src={a.image_url} alt="" fill sizes="48px" className="object-cover" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium leading-snug line-clamp-2" style={{ color: 'var(--text-1)' }}>{title}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-4)' }}>
                      {company ? `${company} · ` : ''}{formatDateTime(a.created_at, lang)}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
