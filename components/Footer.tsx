'use client';

import Link from 'next/link';
import Logo from './Logo';
import { useLang } from '@/contexts/LangContext';
import { localePath } from '@/lib/i18n';

// SNSリンク。URL未開設のためプレースホルダ（url:''）。後で url を埋めるだけで自動的にリンク有効化＋別タブ表示になる。
const SOCIAL_LINKS: { label: string; url: string; icon: React.ReactNode }[] = [
  {
    label: 'YouTube',
    url: '',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
        <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
      </svg>
    ),
  },
  {
    label: 'Instagram',
    url: '',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
      </svg>
    ),
  },
  {
    label: 'Threads',
    url: '',
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M16.705 11.122a6.158 6.158 0 0 0-.234-.106c-.138-2.535-1.523-3.987-3.848-4.001-1.207-.008-2.21.498-2.827 1.428l1.349.926c.461-.7 1.184-.849 1.485-.849h.04c.376.002.66.111.846.325.135.156.226.371.27.643-.333-.057-.692-.074-1.077-.052-2.166.125-3.56 1.388-3.466 3.144.047.89.49 1.657 1.246 2.156.64.422 1.464.629 2.32.582 1.132-.062 2.02-.494 2.64-1.283.471-.6.77-1.376.901-2.354.541.327.94.756 1.162 1.273.376.879.398 2.323-.781 3.502-1.033 1.032-2.275 1.479-4.152 1.492-2.082-.015-3.656-.682-4.68-1.981-.96-1.218-1.456-2.979-1.475-5.233.019-2.254.515-4.014 1.474-5.232 1.025-1.3 2.6-1.967 4.68-1.982 2.096.016 3.698.685 4.762 1.99.522.64.916 1.444 1.176 2.383l1.583-.422c-.315-1.155-.81-2.15-1.484-2.976C18.747 1.516 16.706.686 14.107.668h-.011c-2.595.018-4.613.85-5.997 2.474C6.867 4.585 6.18 6.682 6.158 9.616v.012c.022 2.934.709 5.031 2.04 6.474 1.384 1.623 3.402 2.456 5.997 2.474h.011c2.308-.016 3.936-.621 5.275-1.96 1.753-1.752 1.7-3.946 1.122-5.296-.414-.968-1.207-1.755-2.293-2.272Z" />
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
