import type { Metadata, Viewport } from 'next';
import { notFound } from 'next/navigation';
import { Noto_Sans_JP, Noto_Sans_KR, Montserrat } from 'next/font/google';
import { LangProvider } from '@/contexts/LangContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import Footer from '@/components/Footer';
import TopDateBar from '@/components/TopDateBar';
import { LOCALES, isLocale } from '@/lib/i18n';
import '../globals.css';

// Google AdSense クライアントID
const ADSENSE_CLIENT = 'ca-pub-8382620748313839';

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
      </head>
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <LangProvider lang={lang}>
            <TopDateBar />
            {children}
            <Footer />
          </LangProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
