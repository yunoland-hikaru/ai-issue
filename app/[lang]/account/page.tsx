'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { useLang } from '@/contexts/LangContext';
import { useAuth } from '@/contexts/AuthContext';
import { getBrowserClient } from '@/lib/supabaseClient';
import { localePath } from '@/lib/i18n';
import type { Language } from '@/types';

type Status = 'idle' | 'checking' | 'ok' | 'taken' | 'invalid';

const T: Record<Language, Record<string, string>> = {
  ja: {
    title: 'マイページ', nicknameLabel: 'ニックネーム', email: 'メールアドレス', save: '保存', saved: '保存しました',
    checking: '確認中…', available: '使用できます', taken: 'すでに使用されています', invalid: '2〜20文字で入力してください',
    err: 'エラーが発生しました。', loginNeeded: 'ログインが必要です', login: 'ログイン', home: 'ホーム',
  },
  ko: {
    title: '마이페이지', nicknameLabel: '닉네임', email: '이메일', save: '저장', saved: '저장되었습니다',
    checking: '확인 중…', available: '사용 가능합니다', taken: '이미 사용 중입니다', invalid: '2~20자로 입력해 주세요',
    err: '오류가 발생했습니다.', loginNeeded: '로그인이 필요합니다', login: '로그인', home: '홈',
  },
  en: {
    title: 'My Page', nicknameLabel: 'Nickname', email: 'Email', save: 'Save', saved: 'Saved',
    checking: 'Checking…', available: 'Available', taken: 'Already taken', invalid: 'Use 2–20 characters',
    err: 'Something went wrong.', loginNeeded: 'Login required', login: 'Log in', home: 'Home',
  },
};

const fieldStyle = { color: 'var(--text-1)', background: 'var(--input-bg)', border: '1px solid var(--border-1)' } as const;
const inputCls = 'w-full rounded-lg px-3 py-2.5 text-base focus:outline-none focus:ring-1 focus:ring-[var(--accent)]';

// ニックネーム編集フォーム。key={現在のニックネーム} で再マウントし初期値を同期する。
function NicknameForm({ t, initial }: { t: Record<string, string>; initial: string }) {
  const { user, applyNickname } = useAuth();
  const [value, setValue] = useState(initial);
  const [status, setStatus] = useState<Status>('idle');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const v = value.trim();
    if (v === initial) { return; } // 変更なしはチェック不要
    const id = setTimeout(async () => {
      if (v.length < 2 || v.length > 20) { setStatus('invalid'); return; }
      setStatus('checking');
      try {
        const pattern = v.replace(/[%_\\]/g, '\\$&');
        const { data } = await getBrowserClient().from('profiles').select('id').ilike('nickname', pattern).limit(1);
        const taken = (data as { id: string }[] | null ?? []).some((r) => r.id !== user?.id);
        setStatus(taken ? 'taken' : 'ok');
      } catch { setStatus('ok'); }
    }, 300);
    return () => clearTimeout(id);
  }, [value, initial, user?.id]);

  async function save() {
    const v = value.trim();
    if (v.length < 2 || v.length > 20) { setError(t.invalid); return; }
    if (status === 'taken' || !user) return;
    setSaving(true); setError(''); setDone(false);
    try {
      const { error: upErr } = await getBrowserClient()
        .from('profiles')
        .upsert({ id: user.id, nickname: v, updated_at: new Date().toISOString() }, { onConflict: 'id' });
      if (upErr) {
        if (upErr.code === '23505') { setStatus('taken'); setError(t.taken); }
        else setError(t.err);
        return;
      }
      applyNickname(v);
      setDone(true);
    } catch { setError(t.err); }
    finally { setSaving(false); }
  }

  const v = value.trim();
  const changed = v !== initial;
  const canSave = !saving && changed && v.length >= 2 && v.length <= 20 && status !== 'taken' && status !== 'checking';

  return (
    <div>
      <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-2)' }}>{t.nicknameLabel}</label>
      <input
        value={value}
        onChange={(e) => { setValue(e.target.value); setDone(false); }}
        maxLength={20}
        className={inputCls}
        style={fieldStyle}
      />
      <div className="h-5 mt-1.5 text-xs">
        {changed && status === 'checking' && <span style={{ color: 'var(--text-4)' }}>{t.checking}</span>}
        {changed && status === 'ok' && <span style={{ color: '#16a34a' }}>{t.available}</span>}
        {changed && status === 'taken' && <span style={{ color: 'var(--accent)' }}>{t.taken}</span>}
        {changed && status === 'invalid' && <span style={{ color: 'var(--accent)' }}>{t.invalid}</span>}
        {done && !changed && <span style={{ color: '#16a34a' }}>{t.saved}</span>}
      </div>
      {error && <p className="text-sm mb-2" style={{ color: 'var(--accent)' }}>{error}</p>}
      <button
        onClick={save}
        disabled={!canSave}
        className="py-2.5 px-6 rounded-lg text-base font-semibold transition-opacity hover:opacity-90 disabled:opacity-40"
        style={{ background: 'var(--accent)', color: '#fff' }}
      >
        {saving ? '...' : t.save}
      </button>
    </div>
  );
}

export default function AccountPage() {
  const { lang } = useLang();
  const { user, loading, nickname, displayName } = useAuth();
  const t = T[lang];
  const home = localePath(lang, '/');

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-page)' }}>
      <Navbar />
      <main className="max-w-md mx-auto px-4 py-8 sm:py-12">
        <nav className="text-sm mb-2" style={{ color: 'var(--text-4)' }}>
          <Link href={home} className="hover:text-[var(--accent)] transition-colors">{t.home}</Link>
          <span className="mx-1.5">/</span>
          <span style={{ color: 'var(--accent)' }}>{t.title}</span>
        </nav>
        <h1 className="text-2xl sm:text-3xl font-bold mb-6" style={{ color: 'var(--text-1)' }}>{t.title}</h1>

        {loading ? (
          <div className="w-6 h-6 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin" />
        ) : !user ? (
          <div className="rounded-2xl p-6" style={{ background: 'var(--bg-card)' }}>
            <p className="text-base mb-4" style={{ color: 'var(--text-2)' }}>{t.loginNeeded}</p>
            <Link href={localePath(lang, '/login')} className="inline-block py-2.5 px-6 rounded-lg text-base font-semibold transition-opacity hover:opacity-90" style={{ background: 'var(--accent)', color: '#fff' }}>
              {t.login}
            </Link>
          </div>
        ) : (
          <div className="rounded-2xl p-5 sm:p-6 space-y-5" style={{ background: 'var(--bg-card)' }}>
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-2)' }}>{t.email}</label>
              <input value={user.email ?? ''} readOnly className={inputCls} style={{ ...fieldStyle, color: 'var(--text-4)' }} />
            </div>
            <NicknameForm key={nickname ?? ''} t={t} initial={nickname ?? displayName} />
          </div>
        )}
      </main>
    </div>
  );
}
