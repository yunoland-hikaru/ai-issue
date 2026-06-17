'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { useLang } from '@/contexts/LangContext';
import { useAuth } from '@/contexts/AuthContext';
import { getBrowserClient } from '@/lib/supabaseClient';
import { localePath } from '@/lib/i18n';
import { isValidNickname, NICKNAME_MAX } from '@/lib/nickname';
import type { Language } from '@/types';

type Status = 'idle' | 'checking' | 'ok' | 'taken' | 'invalid';

const T: Record<Language, Record<string, string>> = {
  ja: {
    title: 'マイページ', nicknameLabel: 'ニックネーム', email: 'メールアドレス', save: '保存', saved: '保存しました',
    checking: '確認中…', available: '使用できます', taken: 'すでに使用されています', invalid: '2〜15文字・記号は使えません',
    err: 'エラーが発生しました。', loginNeeded: 'ログインが必要です', login: 'ログイン', home: 'ホーム',
    avatarLabel: 'プロフィール画像', change: '画像を選択', remove: '削除', uploading: 'アップロード中…', avatarHint: 'JPG・PNG・WebP / 2MBまで',
    nicknameHint: 'ニックネームは15文字以内で、記号（特殊文字）は使用できません。',
  },
  ko: {
    title: '마이페이지', nicknameLabel: '닉네임', email: '이메일', save: '저장', saved: '저장되었습니다',
    checking: '확인 중…', available: '사용 가능합니다', taken: '이미 사용 중입니다', invalid: '2~15자, 특수문자는 사용할 수 없습니다',
    err: '오류가 발생했습니다.', loginNeeded: '로그인이 필요합니다', login: '로그인', home: '홈',
    avatarLabel: '프로필 사진', change: '사진 선택', remove: '삭제', uploading: '업로드 중…', avatarHint: 'JPG·PNG·WebP / 최대 2MB',
    nicknameHint: '닉네임은 15자 이하로 정하고 특수문자는 허용되지 않습니다.',
  },
  en: {
    title: 'My Page', nicknameLabel: 'Nickname', email: 'Email', save: 'Save', saved: 'Saved',
    checking: 'Checking…', available: 'Available', taken: 'Already taken', invalid: '2–15 characters, no symbols',
    err: 'Something went wrong.', loginNeeded: 'Login required', login: 'Log in', home: 'Home',
    avatarLabel: 'Profile photo', change: 'Choose image', remove: 'Remove', uploading: 'Uploading…', avatarHint: 'JPG, PNG, WebP / up to 2MB',
    nicknameHint: 'Nicknames must be 15 characters or fewer, with no special characters.',
  },
};

const fieldStyle = { color: 'var(--text-1)', background: 'var(--input-bg)', border: '1px solid var(--border-1)' } as const;
const inputCls = 'w-full rounded-lg px-3 py-2.5 text-base focus:outline-none focus:ring-1 focus:ring-[var(--accent)]';

// 画像をブラウザ側で256pxの正方形にリサイズ → JPEG Blob を返す（容量を抑える）。
async function resizeToSquare(file: File, size = 256): Promise<Blob> {
  const url = URL.createObjectURL(file);
  try {
    const img = document.createElement('img');
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('image load failed'));
      img.src = url;
    });
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('no canvas');
    const scale = Math.max(size / img.width, size / img.height);
    const w = img.width * scale;
    const h = img.height * scale;
    ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/jpeg', 0.85),
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}

// プロフィール（画像＋ニックネーム）編集フォーム。
// 画像を選んだ時点ではプレビューのみ。画像もニックネームも「保存」を押したときにまとめて反映する。
function AccountForm({ t, initialNickname, email }: { t: Record<string, string>; initialNickname: string; email: string }) {
  const { user, avatarUrl, applyNickname, applyAvatar } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);

  // ニックネーム
  const [value, setValue] = useState(initialNickname);
  const [status, setStatus] = useState<Status>('idle');

  // アバター（保存するまではアップロードせずプレビューのみ保持）
  const [pendingBlob, setPendingBlob] = useState<Blob | null>(null);
  const [pendingPreview, setPendingPreview] = useState<string | null>(null);
  const [removePhoto, setRemovePhoto] = useState(false);

  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const initial = (value.trim() || initialNickname || '?').charAt(0).toUpperCase();

  // プレビュー用のオブジェクトURLは不要になったら破棄（差し替え時・アンマウント時）。
  useEffect(() => {
    return () => { if (pendingPreview) URL.revokeObjectURL(pendingPreview); };
  }, [pendingPreview]);

  // ニックネーム重複チェック（変更時のみ・デバウンス）。setStateはタイマー内のみ。
  useEffect(() => {
    const v = value.trim();
    if (v === initialNickname) { return; } // 変更なしはチェック不要（status表示はnickChangedでガード）
    const id = setTimeout(async () => {
      if (!isValidNickname(v)) { setStatus('invalid'); return; }
      setStatus('checking');
      try {
        const pattern = v.replace(/[%_\\]/g, '\\$&');
        const { data } = await getBrowserClient().from('profiles').select('id').ilike('nickname', pattern).limit(1);
        const taken = (data as { id: string }[] | null ?? []).some((r) => r.id !== user?.id);
        setStatus(taken ? 'taken' : 'ok');
      } catch { setStatus('ok'); }
    }, 300);
    return () => clearTimeout(id);
  }, [value, initialNickname, user?.id]);

  async function token() {
    const { data } = await getBrowserClient().auth.getSession();
    return data.session?.access_token ?? '';
  }

  // 画像選択: アップロードはせず、リサイズしてプレビューに保持するだけ。
  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError(t.err); return; }
    setError(''); setDone(false);
    try {
      const blob = await resizeToSquare(file);
      setPendingBlob(blob);
      setPendingPreview(URL.createObjectURL(blob));
      setRemovePhoto(false);
    } catch { setError(t.err); }
  }

  // 削除予定にする（保存時に反映）。
  function onRemove() {
    setPendingBlob(null);
    setPendingPreview(null);
    setRemovePhoto(true);
    setDone(false);
  }

  async function save() {
    const v = value.trim();
    if (!user) return;
    const nickWillChange = v !== initialNickname;
    if (nickWillChange && !isValidNickname(v)) { setError(t.invalid); return; }
    if (nickWillChange && status === 'taken') return;
    setSaving(true); setError(''); setDone(false);
    try {
      // 1) アバター（保留中の変更があれば反映）
      if (pendingBlob) {
        const fd = new FormData();
        fd.append('file', pendingBlob, 'avatar.jpg');
        const res = await fetch('/api/avatar', { method: 'POST', headers: { Authorization: `Bearer ${await token()}` }, body: fd });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'failed');
        applyAvatar(json.url as string);
      } else if (removePhoto && avatarUrl) {
        const res = await fetch('/api/avatar', { method: 'DELETE', headers: { Authorization: `Bearer ${await token()}` } });
        if (!res.ok) throw new Error('failed');
        applyAvatar(null);
      }
      // 2) ニックネーム（変更があれば反映）
      if (v !== initialNickname) {
        const { error: upErr } = await getBrowserClient()
          .from('profiles')
          .upsert({ id: user.id, nickname: v, updated_at: new Date().toISOString() }, { onConflict: 'id' });
        if (upErr) {
          if (upErr.code === '23505') { setStatus('taken'); setError(t.taken); }
          else setError(t.err);
          return;
        }
        applyNickname(v);
      }
      // 保留状態をクリア
      setPendingBlob(null);
      setPendingPreview(null);
      setRemovePhoto(false);
      setDone(true);
    } catch { setError(t.err); }
    finally { setSaving(false); }
  }

  const v = value.trim();
  const nickChanged = v !== initialNickname;
  const photoChanged = !!pendingBlob || removePhoto;
  const dirty = nickChanged || photoChanged;
  // ニックネームの妥当性・重複は「ニックネームを変更したとき」だけ保存条件にする
  // （画像だけ変更したい場合に、過去の入力で残ったstatusで保存がブロックされないように）。
  const nickOk = !nickChanged || (isValidNickname(v) && status !== 'taken' && status !== 'checking');
  const canSave = !saving && dirty && nickOk;

  // 表示するアバター: 保留プレビュー > （削除予定ならなし）> 現在の画像
  const shownAvatar = pendingPreview ?? (removePhoto ? null : avatarUrl);
  const showRemove = !!(pendingPreview || (!removePhoto && avatarUrl));

  return (
    <div className="space-y-5">
      {/* プロフィール画像 */}
      <div>
        <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-2)' }}>{t.avatarLabel}</label>
        <div className="flex items-center gap-4">
          <span
            className="w-16 h-16 shrink-0 rounded-full flex items-center justify-center text-xl font-bold overflow-hidden"
            style={{ background: 'var(--accent)', color: '#fff' }}
          >
            {shownAvatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={shownAvatar} alt="" className="w-full h-full object-cover" />
            ) : (
              initial
            )}
          </span>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <button
                onClick={() => inputRef.current?.click()}
                disabled={saving}
                className="py-1.5 px-4 rounded-lg text-sm font-semibold transition-colors disabled:opacity-40"
                style={{ background: 'var(--input-bg)', color: 'var(--text-2)', border: '1px solid var(--border-1)' }}
              >
                {t.change}
              </button>
              {showRemove && (
                <button
                  onClick={onRemove}
                  disabled={saving}
                  className="py-1.5 px-4 rounded-lg text-sm font-semibold transition-colors disabled:opacity-40"
                  style={{ background: 'var(--input-bg)', color: 'var(--text-2)', border: '1px solid var(--border-1)' }}
                >
                  {t.remove}
                </button>
              )}
            </div>
            <span className="text-xs" style={{ color: 'var(--text-4)' }}>{t.avatarHint}</span>
          </div>
        </div>
      </div>

      {/* メールアドレス（読み取り専用） */}
      <div>
        <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-2)' }}>{t.email}</label>
        <input value={email} readOnly className={inputCls} style={{ ...fieldStyle, color: 'var(--text-4)' }} />
      </div>

      {/* ニックネーム */}
      <div>
        <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-2)' }}>{t.nicknameLabel}</label>
        <input
          value={value}
          onChange={(e) => { setValue(e.target.value); setDone(false); }}
          maxLength={NICKNAME_MAX}
          className={inputCls}
          style={fieldStyle}
        />
        <p className="text-xs mt-1.5" style={{ color: 'var(--text-4)' }}>{t.nicknameHint}</p>
        <div className="h-5 mt-1 text-xs">
          {nickChanged && status === 'checking' && <span style={{ color: 'var(--text-4)' }}>{t.checking}</span>}
          {nickChanged && status === 'ok' && <span style={{ color: '#16a34a' }}>{t.available}</span>}
          {nickChanged && status === 'taken' && <span style={{ color: 'var(--accent)' }}>{t.taken}</span>}
          {nickChanged && status === 'invalid' && <span style={{ color: 'var(--accent)' }}>{t.invalid}</span>}
        </div>
      </div>

      {error && <p className="text-sm" style={{ color: 'var(--accent)' }}>{error}</p>}
      {done && <p className="text-sm" style={{ color: '#16a34a' }}>{t.saved}</p>}

      <button
        onClick={save}
        disabled={!canSave}
        className="w-full py-2.5 rounded-lg text-base font-semibold transition-opacity hover:opacity-90 disabled:opacity-40"
        style={{ background: 'var(--accent)', color: '#fff' }}
      >
        {saving ? '...' : t.save}
      </button>

      <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={onPick} className="hidden" />
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
          <div className="rounded-2xl p-5 sm:p-6" style={{ background: 'var(--bg-card)' }}>
            <AccountForm key={nickname ?? ''} t={t} initialNickname={nickname ?? displayName} email={user.email ?? ''} />
          </div>
        )}
      </main>
    </div>
  );
}
