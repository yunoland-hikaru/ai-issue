'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { useLang } from '@/contexts/LangContext';
import { localePath } from '@/lib/i18n';
import { getBrowserClient } from '@/lib/supabaseClient';
import type { Language } from '@/types';

type Mode = 'signin' | 'signup';

const STRINGS: Record<Language, Record<string, string>> = {
  ja: {
    signin: 'ログイン', signup: '新規登録', email: 'メールアドレス', password: 'パスワード',
    nickname: 'ニックネーム', google: 'Googleで続ける', or: 'または', submitSignin: 'ログイン',
    submitSignup: '登録する', noAccount: 'アカウントをお持ちでないですか？', haveAccount: 'すでにアカウントをお持ちですか？',
    toSignup: '新規登録', toSignin: 'ログイン', checkEmail: '確認メールを送信しました。メール内のリンクから登録を完了してください。',
    errInvalid: 'メールアドレスまたはパスワードが正しくありません。', errGeneric: 'エラーが発生しました。時間をおいて再度お試しください。',
    pwHint: '6文字以上', home: 'ホーム',
  },
  ko: {
    signin: '로그인', signup: '회원가입', email: '이메일', password: '비밀번호',
    nickname: '닉네임', google: 'Google로 계속하기', or: '또는', submitSignin: '로그인',
    submitSignup: '가입하기', noAccount: '계정이 없으신가요?', haveAccount: '이미 계정이 있으신가요?',
    toSignup: '회원가입', toSignin: '로그인', checkEmail: '확인 메일을 보냈습니다. 메일의 링크로 가입을 완료해 주세요.',
    errInvalid: '이메일 또는 비밀번호가 올바르지 않습니다.', errGeneric: '오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
    pwHint: '6자 이상', home: '홈',
  },
  en: {
    signin: 'Log in', signup: 'Sign up', email: 'Email', password: 'Password',
    nickname: 'Nickname', google: 'Continue with Google', or: 'or', submitSignin: 'Log in',
    submitSignup: 'Create account', noAccount: "Don't have an account?", haveAccount: 'Already have an account?',
    toSignup: 'Sign up', toSignin: 'Log in', checkEmail: 'Confirmation email sent. Please complete sign-up via the link in the email.',
    errInvalid: 'Incorrect email or password.', errGeneric: 'Something went wrong. Please try again later.',
    pwHint: 'At least 6 characters', home: 'Home',
  },
};

export default function LoginPage() {
  const { lang } = useLang();
  const router = useRouter();
  const s = STRINGS[lang];
  const home = localePath(lang, '/');

  const [mode, setMode] = useState<Mode>('signin');
  const [form, setForm] = useState({ email: '', password: '', nickname: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'error' | 'sent'>('idle');
  const [message, setMessage] = useState('');

  function update(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === 'loading') return;
    setStatus('loading');
    setMessage('');
    const sb = getBrowserClient();
    try {
      if (mode === 'signin') {
        const { error } = await sb.auth.signInWithPassword({ email: form.email, password: form.password });
        if (error) { setStatus('error'); setMessage(s.errInvalid); return; }
        router.push(home);
      } else {
        const { data, error } = await sb.auth.signUp({
          email: form.email,
          password: form.password,
          options: {
            data: { nickname: form.nickname || form.email.split('@')[0] },
            emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}${home}` : undefined,
          },
        });
        if (error) { setStatus('error'); setMessage(s.errGeneric); return; }
        if (data.session) { router.push(home); return; } // メール確認OFFの場合は即ログイン
        setStatus('sent'); setMessage(s.checkEmail); // メール確認ONの場合
      }
    } catch {
      setStatus('error'); setMessage(s.errGeneric);
    }
  }

  async function handleGoogle() {
    const sb = getBrowserClient();
    await sb.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: typeof window !== 'undefined' ? `${window.location.origin}${home}` : undefined },
    });
  }

  const labelCls = 'block text-sm font-semibold mb-1.5';
  const inputCls = 'w-full rounded-lg px-3 py-2.5 text-base focus:outline-none focus:ring-1 focus:ring-[var(--accent)]';
  const inputStyle = { color: 'var(--text-1)', background: 'var(--input-bg)', border: '1px solid var(--border-1)' } as const;

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-page)' }}>
      <Navbar />
      <main className="max-w-md mx-auto px-4 py-8 sm:py-14">
        <nav className="text-sm mb-2" style={{ color: 'var(--text-4)' }}>
          <Link href={home} className="hover:text-[var(--accent)] transition-colors">{s.home}</Link>
          <span className="mx-1.5">/</span>
          <span style={{ color: 'var(--accent)' }}>{mode === 'signin' ? s.signin : s.signup}</span>
        </nav>
        <h1 className="text-2xl sm:text-3xl font-bold mb-6" style={{ color: 'var(--text-1)' }}>
          {mode === 'signin' ? s.signin : s.signup}
        </h1>

        {status === 'sent' ? (
          <div className="rounded-2xl p-8 text-center" style={{ background: 'var(--bg-card)' }}>
            <p className="text-base" style={{ color: 'var(--text-1)' }}>{message}</p>
          </div>
        ) : (
          <div className="rounded-2xl p-5 sm:p-6 space-y-5" style={{ background: 'var(--bg-card)' }}>
            {/* Google */}
            <button
              type="button"
              onClick={handleGoogle}
              className="hov-fill w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-base font-semibold"
              style={{ background: 'var(--input-bg)', color: 'var(--text-1)', border: '1px solid var(--border-1)' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
              </svg>
              {s.google}
            </button>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px" style={{ background: 'var(--border-1)' }} />
              <span className="text-xs" style={{ color: 'var(--text-4)' }}>{s.or}</span>
              <div className="flex-1 h-px" style={{ background: 'var(--border-1)' }} />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <div>
                  <label className={labelCls} style={{ color: 'var(--text-2)' }}>{s.nickname}</label>
                  <input className={inputCls} style={inputStyle} value={form.nickname} onChange={update('nickname')} />
                </div>
              )}
              <div>
                <label className={labelCls} style={{ color: 'var(--text-2)' }}>{s.email}</label>
                <input className={inputCls} style={inputStyle} type="email" value={form.email} onChange={update('email')} placeholder="your@email.com" required />
              </div>
              <div>
                <label className={labelCls} style={{ color: 'var(--text-2)' }}>{s.password}</label>
                <input className={inputCls} style={inputStyle} type="password" value={form.password} onChange={update('password')} minLength={6} required />
                {mode === 'signup' && <p className="text-xs mt-1" style={{ color: 'var(--text-4)' }}>{s.pwHint}</p>}
              </div>

              {status === 'error' && <p className="text-sm" style={{ color: 'var(--accent)' }}>{message}</p>}

              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full py-3 rounded-lg text-base font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ background: 'var(--accent)', color: '#fff' }}
              >
                {status === 'loading' ? '...' : mode === 'signin' ? s.submitSignin : s.submitSignup}
              </button>
            </form>

            <p className="text-sm text-center" style={{ color: 'var(--text-3)' }}>
              {mode === 'signin' ? s.noAccount : s.haveAccount}{' '}
              <button
                type="button"
                onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setStatus('idle'); setMessage(''); }}
                className="font-semibold"
                style={{ color: 'var(--accent)' }}
              >
                {mode === 'signin' ? s.toSignup : s.toSignin}
              </button>
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
