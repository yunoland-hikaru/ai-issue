import type { Metadata } from 'next';
import { LangProvider } from '@/contexts/LangContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI issue — AIニュースをわかりやすく',
  description: '毎日溢れるAI関連ニュース・新着AIツール情報をAIが自動収集し、わかりやすく届けるメディアプラットフォーム',
};

// Runs before React hydration to prevent flash of wrong theme
const themeScript = `
(function(){
  try{
    var t=localStorage.getItem('theme');
    if(!t) t=window.matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light';
    if(t==='dark') document.documentElement.classList.add('dark');
  }catch(e){}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className="h-full antialiased">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&family=Noto+Sans+KR:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <LangProvider>{children}</LangProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
