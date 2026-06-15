'use client';

import Link from 'next/link';
import Logo from './Logo';
import { useLang } from '@/contexts/LangContext';
import { localePath } from '@/lib/i18n';

// SNSリンク。URL未開設のためプレースホルダ（url:''）。後で url を埋めるだけで自動的にリンク有効化＋別タブ表示になる。
const SOCIAL_LINKS: { label: string; url: string; icon: React.ReactNode }[] = [
  {
    label: 'Threads',
    url: 'https://www.threads.com/@ai_issue_jp',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.166 1.43 1.781 3.631 2.695 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.36-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.964-.065-1.19.408-2.285 1.33-3.082.88-.76 2.119-1.207 3.583-1.291 1.024-.06 1.984-.013 2.859.135-.117-.7-.353-1.255-.704-1.654-.479-.546-1.222-.823-2.207-.83h-.027c-.792 0-1.866.218-2.552 1.237l-1.683-1.131c.918-1.362 2.408-2.11 4.235-2.11h.04c3.054.02 4.872 1.89 5.052 5.151.105.045.207.092.307.141 1.408.66 2.439 1.661 2.979 2.895.752 1.719.823 4.517-1.456 6.795-1.74 1.738-3.851 2.523-6.835 2.545Zm1.589-7.748c-.234 0-.471.007-.713.021-1.793.101-2.912.925-2.85 2.1.064 1.231 1.42 1.804 2.727 1.734 1.202-.064 2.78-.533 3.044-3.473a8.31 8.31 0 0 0-2.208-.382Z" />
      </svg>
    ),
  },
  {
    label: 'X',
    url: 'https://x.com/AI_issue',
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
      </svg>
    ),
  },
];

export default function Footer() {
  const { t, lang } = useLang();
  const f = t.footer;
  const year = new Date().getFullYear();

  const linkCls = 'text-sm transition-colors';
  const linkStyle = { color: 'rgba(255,255,255,0.6)' } as const;
  const hover = (e: React.MouseEvent<HTMLElement>) => { e.currentTarget.style.color = '#fff'; };
  const unhover = (e: React.MouseEvent<HTMLElement>) => { e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; };

  return (
    <footer className="mt-auto" style={{ background: '#0f0f1a', color: '#fff' }}>
      <div className="max-w-6xl mx-auto px-4 py-10 sm:py-12">
        <div className="flex flex-col sm:flex-row sm:justify-between gap-8">
          {/* Brand */}
          <div className="max-w-xs">
            <Logo size="md" tone="onDark" href={localePath(lang, '/')} />
            <p className="mt-4 text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
              {f.tagline}
            </p>
            <p className="mt-1.5 text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>
              {f.description}
            </p>

            {/* SNS（プレースホルダ。SOCIAL_LINKS の url を埋めると有効化） */}
            <div className="mt-5 flex items-center gap-2.5">
              {SOCIAL_LINKS.map((s) => (
                <a
                  key={s.label}
                  href={s.url || '#'}
                  aria-label={s.label}
                  {...(s.url ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  className="w-9 h-9 rounded-full flex items-center justify-center transition-colors"
                  style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.16)'; e.currentTarget.style.color = '#fff'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; }}
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          <div className="flex gap-12 sm:gap-16">
            <nav className="flex flex-col gap-2.5">
              <h3 className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
                {f.navHeading}
              </h3>
              <Link href={localePath(lang, '/')} className={linkCls} style={linkStyle} onMouseEnter={hover} onMouseLeave={unhover}>{f.home}</Link>
              <Link href={localePath(lang, '/about')} className={linkCls} style={linkStyle} onMouseEnter={hover} onMouseLeave={unhover}>{f.about}</Link>
              <Link href={localePath(lang, '/newsletter')} className={linkCls} style={linkStyle} onMouseEnter={hover} onMouseLeave={unhover}>{f.newsletter}</Link>
            </nav>

            <nav className="flex flex-col gap-2.5">
              <h3 className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
                {f.infoHeading}
              </h3>
              <Link href={localePath(lang, '/contact')} className={linkCls} style={linkStyle} onMouseEnter={hover} onMouseLeave={unhover}>{f.contact}</Link>
              <Link href={localePath(lang, '/privacy')} className={linkCls} style={linkStyle} onMouseEnter={hover} onMouseLeave={unhover}>{f.privacy}</Link>
              <Link href={localePath(lang, '/terms')} className={linkCls} style={linkStyle} onMouseEnter={hover} onMouseLeave={unhover}>{f.terms}</Link>
            </nav>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="mt-10 pt-6 flex items-center justify-between"
          style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}
        >
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
            © {year} AI issue. {f.rights}
          </p>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            aria-label={f.toTop}
            className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-colors"
            style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.16)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="m18 15-6-6-6 6" />
            </svg>
          </button>
        </div>
      </div>
    </footer>
  );
}
