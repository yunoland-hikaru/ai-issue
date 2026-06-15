import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { LOCALES, DEFAULT_LOCALE } from '@/lib/i18n';

// ロケール接頭辞の無いリクエストを /ja /ko /en のいずれかへリダイレクト。
// 優先順: Cookie(手動選択) → アクセス国(IPジオ) → Accept-Language → 既定(ja=x-default)。
function detectLocale(request: NextRequest): string {
  const cookie = request.cookies.get('lang')?.value;
  if (cookie && LOCALES.includes(cookie as (typeof LOCALES)[number])) return cookie;

  const country = request.headers.get('x-vercel-ip-country');
  if (country === 'KR') return 'ko';
  if (country === 'JP') return 'ja';

  const accept = (request.headers.get('accept-language') ?? '').toLowerCase();
  if (/(^|[,\s])ko\b/.test(accept)) return 'ko';
  if (/(^|[,\s])ja\b/.test(accept)) return 'ja';
  if (/(^|[,\s])en\b/.test(accept)) return 'en';

  return DEFAULT_LOCALE;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const hasLocale = LOCALES.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  );
  if (hasLocale) return;

  const locale = detectLocale(request);
  request.nextUrl.pathname = `/${locale}${pathname === '/' ? '' : pathname}`;
  return NextResponse.redirect(request.nextUrl);
}

export const config = {
  // _next・api・拡張子付きファイル(robots.txt/sitemap.xml/favicon.ico/画像など)は除外。
  matcher: ['/((?!_next|api|.*\\..*).*)'],
};
