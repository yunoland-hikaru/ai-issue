'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { useLang } from '@/contexts/LangContext';
import { localePath } from '@/lib/i18n';

export default function NewsletterPage() {
  const { t, lang } = useLang();
  const f = t.newsletterForm;
  const router = useRouter();
  const home = localePath(lang, '/');

  const [form, setForm] = useState({ name: '', company: '', title: '', phone: '', email: '' });
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');

  function update(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) => setForm((s) => ({ ...s, [key]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === 'loading') return;
    if (!consent) {
      setStatus('error');
      setMessage(f.agreeRequired);
      return;
    }
    setStatus('loading');
    setMessage('');
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, consent }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setStatus('done');
        setMessage(data.alreadyRegistered ? f.alreadyRegistered : f.thanks);
      } else {
        setStatus('error');
        setMessage(f.errorMsg);
      }
    } catch {
      setStatus('error');
      setMessage(f.errorMsg);
    }
  }

  const labelCls = 'block text-sm font-semibold mb-1.5';
  const inputCls =
    'w-full rounded-lg px-3 py-2.5 text-base focus:outline-none focus:ring-1 focus:ring-[var(--accent)]';
  const inputStyle = {
    color: 'var(--text-1)',
    background: 'var(--input-bg)',
    border: '1px solid var(--border-1)',
  } as const;
  const req = <span style={{ color: 'var(--accent)' }}>*</span>;
  const opt = <span className="text-xs font-normal" style={{ color: 'var(--text-4)' }}> ({f.optional})</span>;

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-page)' }}>
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-6 sm:py-10">
        {/* Breadcrumb + title */}
        <nav className="text-sm mb-2" style={{ color: 'var(--text-4)' }}>
          <Link href={home} className="hover:text-[var(--accent)] transition-colors">Home</Link>
          <span className="mx-1.5">/</span>
          <span style={{ color: 'var(--accent)' }}>{f.breadcrumb}</span>
        </nav>
        <h1 className="text-2xl sm:text-3xl font-bold mb-6" style={{ color: 'var(--text-1)' }}>{f.pageTitle}</h1>

        {status === 'done' ? (
          <div className="rounded-2xl p-8 text-center" style={{ background: 'var(--bg-card)' }}>
            <div
              className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center"
              style={{ background: 'var(--accent)' }}
            >
              <svg width="24" height="24" fill="none" stroke="#fff" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </div>
            <p className="text-base font-medium mb-6" style={{ color: 'var(--text-1)' }}>{message}</p>
            <Link
              href={home}
              className="inline-block py-2.5 px-6 rounded-lg text-base font-semibold transition-opacity hover:opacity-90"
              style={{ background: 'var(--accent)', color: '#fff' }}
            >
              Home
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Consent notice */}
            <section className="rounded-2xl p-5" style={{ background: 'var(--bg-card)' }}>
              <h2 className="text-sm font-bold mb-2" style={{ color: 'var(--text-1)' }}>{f.consentHeading}</h2>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-3)' }}>{f.consentBody}</p>
            </section>

            {/* Fields */}
            <section className="rounded-2xl p-5 space-y-4" style={{ background: 'var(--bg-card)' }}>
              <div>
                <label className={labelCls} style={{ color: 'var(--text-2)' }}>{f.name} {req}</label>
                <input className={inputCls} style={inputStyle} value={form.name} onChange={update('name')} required />
              </div>
              <div>
                <label className={labelCls} style={{ color: 'var(--text-2)' }}>{f.company}{opt}</label>
                <input className={inputCls} style={inputStyle} value={form.company} onChange={update('company')} />
              </div>
              <div>
                <label className={labelCls} style={{ color: 'var(--text-2)' }}>{f.jobTitle}{opt}</label>
                <input className={inputCls} style={inputStyle} value={form.title} onChange={update('title')} />
              </div>
              <div>
                <label className={labelCls} style={{ color: 'var(--text-2)' }}>{f.phone}{opt}</label>
                <input className={inputCls} style={inputStyle} type="tel" value={form.phone} onChange={update('phone')} />
              </div>
              <div>
                <label className={labelCls} style={{ color: 'var(--text-2)' }}>{f.email} {req}</label>
                <input className={inputCls} style={inputStyle} type="email" value={form.email} onChange={update('email')} placeholder="your@email.com" required />
              </div>
            </section>

            {/* Consent checkbox */}
            <label className="flex items-start gap-2.5 cursor-pointer px-1">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--accent)]"
              />
              <span className="text-sm" style={{ color: 'var(--text-2)' }}>{f.agree} {req}</span>
            </label>

            {status === 'error' && <p className="text-sm" style={{ color: 'var(--accent)' }}>{message}</p>}

            {/* Buttons */}
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={status === 'loading'}
                className="flex-1 py-3 rounded-lg text-base font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ background: 'var(--accent)', color: '#fff' }}
              >
                {status === 'loading' ? '...' : f.submit}
              </button>
              <button
                type="button"
                onClick={() => router.push(home)}
                className="flex-1 py-3 rounded-lg text-base font-semibold transition-colors"
                style={{ background: 'var(--input-bg)', color: 'var(--text-2)', border: '1px solid var(--border-1)' }}
              >
                {f.cancel}
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
