import type { Metadata } from 'next';
import { LangProvider } from '@/contexts/LangContext';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI issue — AIニュースをわかりやすく',
  description: '毎日쏟아지는 AI関連ニュース・新着AIツール情報をAIが自動収集し、わかりやすく届けるメディアプラットフォーム',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className="h-full antialiased">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&family=Noto+Sans+KR:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col" style={{ background: '#0f0f1a' }}>
        <LangProvider>{children}</LangProvider>
      </body>
    </html>
  );
}
