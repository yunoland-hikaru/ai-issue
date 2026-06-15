'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useLang } from '@/contexts/LangContext';
import { useAuth } from '@/contexts/AuthContext';
import { localePath } from '@/lib/i18n';

const LABELS = {
  ja: { login: 'ログイン', logout: 'ログアウト', account: 'アカウント' },
  ko: { login: '로그인', logout: '로그아웃', account: '계정' },
  en: { login: 'Log in', logout: 'Log out', account: 'Account' },
};

const userIcon = (
  <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
  </svg>
);

export default function UserMenu() {
  const { lang } = useLang();
  const { user, signOut } = useAuth();
  const l = LABELS[lang];
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  // 未ログイン: ログインページへのリンク
  if (!user) {
    return (
      <Link href={localePath(lang, '/login')} className="transition-colors" style={{ color: 'var(--text-3)' }} aria-label={l.login}>
        {userIcon}
      </Link>
    );
  }

  // ログイン中: アバター（頭文字）＋ドロップダウン
  const name = (user.user_metadata?.nickname as string) || user.email?.split('@')[0] || 'U';
  const initial = name.charAt(0).toUpperCase();

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold transition-opacity hover:opacity-90"
        style={{ background: 'var(--accent)', color: '#fff' }}
        aria-label={l.account}
      >
        {initial}
      </button>
      {open && (
        <div
          className="absolute right-0 mt-2 w-56 rounded-xl shadow-xl overflow-hidden z-50 border"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border-1)' }}
        >
          <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border-2)' }}>
            <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-1)' }}>{name}</p>
            <p className="text-xs truncate" style={{ color: 'var(--text-4)' }}>{user.email}</p>
          </div>
          <button
            onClick={() => { setOpen(false); signOut(); }}
            className="w-full text-left px-4 py-2.5 text-sm transition-colors"
            style={{ color: 'var(--text-2)', background: 'transparent' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--input-bg)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
          >
            {l.logout}
          </button>
        </div>
      )}
    </div>
  );
}
