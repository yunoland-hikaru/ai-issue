'use client';

import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { useLang } from '@/contexts/LangContext';
import { useAuth } from '@/contexts/AuthContext';
import { getBrowserClient } from '@/lib/supabaseClient';
import { isValidNickname, sanitizeNickname, NICKNAME_MAX } from '@/lib/nickname';
import type { Language } from '@/types';

type Status = 'idle' | 'checking' | 'ok' | 'taken' | 'invalid';

const T: Record<Language, Record<string, string>> = {
  ja: {
    title: 'ニックネームを設定', desc: 'コメントなどで表示される名前です。',
    placeholder: 'ニックネーム', save: '保存', checking: '確認中…', available: '使用できます',
    taken: 'すでに使用されています', invalid: '2〜15文字・記号は使えません', err: 'エラーが発生しました。', logout: 'ログアウト',
    hint: 'ニックネームは15文字以内で、記号（特殊文字）は使用できません。',
  },
  ko: {
    title: '닉네임 설정', desc: '댓글 등에 표시되는 이름입니다.',
    placeholder: '닉네임', save: '저장', checking: '확인 중…', available: '사용 가능합니다',
    taken: '이미 사용 중입니다', invalid: '2~15자, 특수문자는 사용할 수 없습니다', err: '오류가 발생했습니다.', logout: '로그아웃',
    hint: '닉네임은 15자 이하로 정하고 특수문자는 허용되지 않습니다.',
  },
  en: {
    title: 'Set your nickname', desc: 'This name is shown on your comments.',
    placeholder: 'Nickname', save: 'Save', checking: 'Checking…', available: 'Available',
    taken: 'Already taken', invalid: '2–15 characters, no symbols', err: 'Something went wrong.', logout: 'Log out',
    hint: 'Nicknames must be 15 characters or fewer, with no special characters.',
  },
};

function suggest(user: User | null): string {
  const md = (user?.user_metadata ?? {}) as Record<string, unknown>;
  const raw = (md.nickname as string) || (md.full_name as string) || (md.name as string) || user?.email?.split('@')[0] || '';
  return sanitizeNickname(raw.toString().trim());
}

export default function NicknameModal() {
  const { user, applyNickname, signOut } = useAuth();
  const { lang } = useLang();
  const t = T[lang];

  const [value, setValue] = useState(() => suggest(user));
  const [status, setStatus] = useState<Status>('idle');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // 重複チェック（デバウンス。setStateはタイマー内のみ）
  useEffect(() => {
    const v = value.trim();
    const id = setTimeout(async () => {
      if (!isValidNickname(v)) { setStatus(v ? 'invalid' : 'idle'); return; }
      setStatus('checking');
      try {
        const pattern = v.replace(/[%_\\]/g, '\\$&'); // ilikeのワイルドカード無効化
        const { data } = await getBrowserClient().from('profiles').select('id').ilike('nickname', pattern).limit(1);
        const taken = (data as { id: string }[] | null ?? []).some((r) => r.id !== user?.id);
        setStatus(taken ? 'taken' : 'ok');
      } catch {
        setStatus('ok'); // チェック失敗時は保存時のDB制約に委ねる
      }
    }, 300);
    return () => clearTimeout(id);
  }, [value, user?.id]);

  async function save() {
    const v = value.trim();
    if (!isValidNickname(v)) { setError(t.invalid); return; }
    if (status === 'taken') { setError(t.taken); return; }
    if (!user) return;
    setSaving(true); setError('');
    try {
      const { error: upErr } = await getBrowserClient()
        .from('profiles')
        .upsert({ id: user.id, nickname: v, updated_at: new Date().toISOString() }, { onConflict: 'id' });
      if (upErr) {
        if (upErr.code === '23505') { setStatus('taken'); setError(t.taken); } // nicknameユニーク違反
        else setError(t.err);
        return;
      }
      applyNickname(v);
    } catch {
      setError(t.err);
    } finally {
      setSaving(false);
    }
  }

  const v = value.trim();
  const canSave = !saving && isValidNickname(v) && status !== 'taken' && status !== 'checking';

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="w-full max-w-sm rounded-2xl p-6" style={{ background: 'var(--bg-card)' }}>
        <h2 className="text-lg font-bold mb-1" style={{ color: 'var(--text-1)' }}>{t.title}</h2>
        <p className="text-sm mb-4" style={{ color: 'var(--text-3)' }}>{t.desc}</p>

        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={t.placeholder}
          maxLength={NICKNAME_MAX}
          autoFocus
          onKeyDown={(e) => { if (e.key === 'Enter' && canSave) save(); }}
          className="w-full rounded-lg px-3 py-2.5 text-base focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
          style={{ color: 'var(--text-1)', background: 'var(--input-bg)', border: '1px solid var(--border-1)' }}
        />

        <div className="h-5 mt-1.5 text-xs">
          {status === 'checking' && <span style={{ color: 'var(--text-4)' }}>{t.checking}</span>}
          {status === 'ok' && <span style={{ color: '#16a34a' }}>{t.available}</span>}
          {status === 'taken' && <span style={{ color: 'var(--accent)' }}>{t.taken}</span>}
          {status === 'invalid' && <span style={{ color: 'var(--accent)' }}>{t.invalid}</span>}
        </div>

        <p className="text-xs mb-2" style={{ color: 'var(--text-4)' }}>{t.hint}</p>

        {error && <p className="text-sm mb-2" style={{ color: 'var(--accent)' }}>{error}</p>}

        <button
          onClick={save}
          disabled={!canSave}
          className="w-full py-2.5 rounded-lg text-base font-semibold transition-opacity hover:opacity-90 disabled:opacity-40 mt-1"
          style={{ background: 'var(--accent)', color: '#fff' }}
        >
          {saving ? '...' : t.save}
        </button>
        <button onClick={() => signOut()} className="hov-accent w-full mt-2 text-xs" style={{ color: 'var(--text-4)' }}>
          {t.logout}
        </button>
      </div>
    </div>
  );
}
