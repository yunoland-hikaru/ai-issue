'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { useLang } from '@/contexts/LangContext';
import { localePath } from '@/lib/i18n';

export default function ContactPage() {
  const { t, lang } = useLang();
  const c = t.contactForm;
  const router = useRouter();
  const home = localePath(lang, '/');

  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');

  function update(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((s) => ({ ...s, [key]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === 'loading') return;
    setStatus('loading');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      setStatus(res.ok ? 'done' : 'error');
    } catch {
      setStatus('error');
    }
  }

  const labelCls = 'block text-sm font-semibold mb-1.5';
  const fieldStyle = {
    color: 'var(--text-1)',
    background: 'var(--input-bg)',
    border: '1px solid var(--border-1)',
  } as const;
  const inputCls = 'w-full rounded-lg px-3 py-2.5 text-base focus:outline-none focus:ring-1 focus:ring-[var(--accent)]';
  const req = <span style={{ color: 'var(--accent)' }}>*</span>;

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-page)' }}>
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-6 sm:py-10">
        <nav className="text-sm mb-2" style={{ color: 'var(--text-4)' }}>
          <Link href={home} className="hover:text-[var(--accent)] transition-colors">Home</Link>
          <span className="mx-1.5">/</span>
          <span style={{ color: 'var(--accent)' }}>{c.pageTitle}</span>
        </nav>
        <h1 className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: 'var(--text-1)' }}>{c.pageTitle}</h1>
        <p className="text-sm mb-6" style={{ color: 'var(--text-3)' }}>{c.intro}</p>

        {status === 'done' ? (
          <div className="rounded-2xl p-8 text-center" style={{ background: 'var(--bg-card)' }}>
            <div className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: 'var(--accent)' }}>
              <svg width="24" height="24" fill="none" stroke="#fff" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5" /></svg>
            </div>
            <p className="text-base font-medium mb-6" style={{ color: 'var(--text-1)' }}>{c.thanks}</p>
            <Link href={home} className="inline-block py-2.5 px-6 rounded-lg text-base font-semibold transition-opacity hover:opacity-90" style={{ background: 'var(--accent)', color: '#fff' }}>Home</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="rounded-2xl p-5 space-y-4" style={{ background: 'var(--bg-card)' }}>
            <div>
              <label className={labelCls} style={{ color: 'var(--text-2)' }}>{c.name} {req}</label>
              <input className={inputCls} style={fieldStyle} value={form.name} onChange={update('name')} required />
            </div>
            <div>
              <label className={labelCls} style={{ color: 'var(--text-2)' }}>{c.email} {req}</label>
              <input className={inputCls} style={fieldStyle} type="email" value={form.email} onChange={update('email')} placeholder="your@email.com" required />
            </div>
            <div>
              <label className={labelCls} style={{ color: 'var(--text-2)' }}>{c.message} {req}</label>
              <textarea className={`${inputCls} min-h-[140px] resize-y`} style={fieldStyle} value={form.message} onChange={update('message')} required />
            </div>

            {status === 'error' && <p className="text-sm" style={{ color: 'var(--accent)' }}>{c.errorMsg}</p>}

            <div className="flex items-center gap-3 pt-1">
              <button
                type="submit"
                disabled={status === 'loading'}
                className="flex-1 py-3 rounded-lg text-base font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ background: 'var(--accent)', color: '#fff' }}
              >
                {status === 'loading' ? '...' : c.submit}
              </button>
              <button
                type="button"
                onClick={() => router.push(home)}
                className="flex-1 py-3 rounded-lg text-base font-semibold transition-colors"
                style={{ background: 'var(--input-bg)', color: 'var(--text-2)', border: '1px solid var(--border-1)' }}
              >
                {t.newsletterForm.cancel}
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
