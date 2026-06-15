import type { Metadata, Viewport } from 'next';
import { notFound } from 'next/navigation';
import { Noto_Sans_JP, Noto_Sans_KR, Montserrat } from 'next/font/google';
import { LangProvider } from '@/contexts/LangContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider } from '@/contexts/AuthContext';
import Footer from '@/components/Footer';
import TopDateBar from '@/components/TopDateBar';
import NicknameGate from '@/components/NicknameGate';
import { LOCALES, isLocale } from '@/lib/i18n';
import '../globals.css';

// Google AdSense クライアントID
const ADSENSE_CLIENT = 'ca-pub-7459697768495563';

// Google Analytics 測定ID（gtag.js）
const GA_ID = 'G-M1KGG91194';

// Microsoft Clarity プロジェクトID
const CLARITY_ID = 'x79kekypbr';

// ロゴ用ワードマーク（テスラ風のジオメトリックな高級感）。
const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  display: 'swap',
  variable: '--font-montserrat',
});

// next/fontでセルフホスト（外部リクエストなし）。CJKフォントは大きいため preload は無効化。
const notoSansJP = Noto_Sans_JP({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  display: 'swap',
  preload: false,
  variable: '--font-noto-jp',
});

const notoSansKR = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  display: 'swap',
  preload: false,
  variable: '--font-noto-kr',
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://ai-issue.com';
const SITE_DESC = '毎日溢れるAI関連ニュース・新着AIツール情報をAIが自動収集し、わかりやすく届けるメディアプラットフォーム';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'AI issue — AIニュースをわかりやすく',
    template: '%s — AI issue',
  },
  description: SITE_DESC,
  applicationName: 'AI issue',
  openGraph: {
    type: 'website',
    siteName: 'AI issue',
    url: SITE_URL,
    title: 'AI issue — AIニュースをわかりやすく',
    description: SITE_DESC,
  },
  twitter: {
    card: 'summary',
    title: 'AI issue — AIニュースをわかりやすく',
    description: SITE_DESC,
  },
  other: { 'google-adsense-account': ADSENSE_CLIENT },
};

// 仕様デフォルトのライト背景にモバイルの上部バー色を合わせる
export const viewport: Viewport = {
  themeColor: '#f5f5fa',
};

// 静的に生成する3ロケール。
export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

// Runs before React hydration to prevent flash of wrong theme.
// 仕様: デフォルトは常にライト。OSの prefers-color-scheme には追従しない。
const themeScript = `
(function(){
  try{
    if(localStorage.getItem('theme')==='dark') document.documentElement.classList.add('dark');
  }catch(e){}
})();
`;

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  return (
    <html lang={lang} className={`h-full antialiased ${notoSansJP.variable} ${notoSansKR.variable} ${montserrat.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        {/* Google AdSense ローダー（SSRのheadに実体の<script>を出す。crawlerが検出できる形）。 */}
        <script
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
          crossOrigin="anonymous"
        />
        {/* Google Analytics (gtag.js) — 全ページ共通でheadに出力 */}
        <script async src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_ID}');`,
          }}
        />
        {/* Microsoft Clarity — 全ページ共通でheadに出力 */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(c,l,a,r,i,t,y){
        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
    })(window, document, "clarity", "script", "${CLARITY_ID}");`,
          }}
        />
        {/* Organization + WebSite 構造化データ（全ページ共通、ブランド/サイト認識用） */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@graph': [
                {
                  '@type': 'Organization',
                  '@id': `${SITE_URL}/#org`,
                  name: 'AI issue',
                  url: SITE_URL,
                  logo: `${SITE_URL}/email-logo.png`,
                },
                {
                  '@type': 'WebSite',
                  '@id': `${SITE_URL}/#website`,
                  name: 'AI issue',
                  url: SITE_URL,
                  inLanguage: ['ja', 'ko', 'en'],
                  publisher: { '@id': `${SITE_URL}/#org` },
                },
              ],
            }),
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <LangProvider lang={lang}>
            <AuthProvider>
              <TopDateBar />
              {children}
              <Footer />
              <NicknameGate />
            </AuthProvider>
          </LangProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
