'use client';

import Link from 'next/link';
import Logo from './Logo';
import { useLang } from '@/contexts/LangContext';
import { localePath } from '@/lib/i18n';

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
