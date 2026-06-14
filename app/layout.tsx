import type { Metadata, Viewport } from 'next';
import { Noto_Sans_JP, Noto_Sans_KR, Montserrat } from 'next/font/google';
import { LangProvider } from '@/contexts/LangContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import Footer from '@/components/Footer';
import './globals.css';

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

export const metadata: Metadata = {
  title: 'AI issue — AIニュースをわかりやすく',
  description: '毎日溢れるAI関連ニュース・新着AIツール情報をAIが自動収集し、わかりやすく届けるメディアプラットフォーム',
  other: { 'google-adsense-account': ADSENSE_CLIENT },
};

// 仕様デフォルトのライト背景にモバイルの上部バー色を合わせる
export const viewport: Viewport = {
  themeColor: '#f5f5fa',
};

// Runs before React hydration to prevent flash of wrong theme.
// 仕様: デフォルトは常にライト。OSの prefers-color-scheme には追従しない
// （端末ごとに既定背景が変わる問題を防ぐ）。明示的に 'dark' を保存した場合のみダーク。
const themeScript = `
(function(){
  try{
    if(localStorage.getItem('theme')==='dark') document.documentElement.classList.add('dark');
  }catch(e){}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className={`h-full antialiased ${notoSansJP.variable} ${notoSansKR.variable} ${montserrat.variable}`}>
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
          <LangProvider>
            {children}
            <Footer />
          </LangProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
