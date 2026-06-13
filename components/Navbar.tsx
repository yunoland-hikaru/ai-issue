'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useLang } from '@/contexts/LangContext';
import { useTheme } from '@/contexts/ThemeContext';
import type { Language } from '@/types';

const LANGUAGES: { code: Language; label: string; flag: string }[] = [
  { code: 'ja', label: '日本語', flag: '🇯🇵' },
  { code: 'ko', label: '한국어', flag: '🇰🇷' },
  { code: 'en', label: 'English', flag: '🇺🇸' },
];

export default function Navbar() {
  const { lang, setLang, t } = useLang();
  const { theme, toggleTheme } = useTheme();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const iconButtons = (
    <>
      {/* Dark/light toggle */}
      <button
        onClick={toggleTheme}
        className="transition-colors"
        style={{ color: 'var(--text-3)' }}
        aria-label={theme === 'dark' ? 'ライトモードに切り替え' : 'ダークモードに切り替え'}
      >
        {theme === 'dark' ? (
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="5" />
            <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
          </svg>
        ) : (
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        )}
      </button>

      <button className="transition-colors" style={{ color: 'var(--text-3)' }} aria-label={t.nav.search}>
        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
        </svg>
      </button>
      <button className="transition-colors" style={{ color: 'var(--text-3)' }} aria-label={t.nav.notifications}>
        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
      </button>

      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen((v) => !v)}
          className="transition-colors"
          style={{ color: 'var(--text-3)' }}
          aria-label={t.nav.language}
        >
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" />
            <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
        </button>
        {dropdownOpen && (
          <div
            className="absolute right-0 mt-2 w-40 rounded-xl shadow-xl overflow-hidden z-50 border"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border-1)' }}
          >
            {LANGUAGES.map((l) => (
              <button
                key={l.code}
                onClick={() => { setLang(l.code); setDropdownOpen(false); }}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm transition-colors"
                style={{
                  color: lang === l.code ? '#7F77DD' : 'var(--text-2)',
                  background: 'transparent',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--input-bg)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
              >
                <span>{l.flag}</span>
                <span className="flex-1 text-left">{l.label}</span>
                {lang === l.code && (
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <button className="transition-colors" style={{ color: 'var(--text-3)' }} aria-label={t.nav.user}>
        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
        </svg>
      </button>
    </>
  );

  return (
    <nav className="sticky top-0 z-50 border-b" style={{ background: 'var(--bg-nav)', borderColor: 'var(--border-1)' }}>
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="text-lg font-bold tracking-tight hover:opacity-80 transition-opacity" style={{ color: '#7F77DD' }}>
          AI issue
        </Link>

        {/* Desktop icons */}
        <div className="hidden sm:flex items-center gap-4">
          {iconButtons}
        </div>

        {/* Hamburger button (mobile only) */}
        <button
          className="sm:hidden transition-colors p-1"
          style={{ color: 'var(--text-3)' }}
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="メニュー"
        >
          {menuOpen ? (
            <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          ) : (
            <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div
          className="sm:hidden border-t px-4 py-3 flex items-center gap-5"
          style={{ background: 'var(--bg-nav)', borderColor: 'var(--border-1)' }}
        >
          {iconButtons}
        </div>
      )}
    </nav>
  );
}
