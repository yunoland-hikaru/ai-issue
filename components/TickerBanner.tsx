'use client';

import type { Article } from '@/types';

interface TickerBannerProps {
  articles: Article[];
}

export default function TickerBanner({ articles }: TickerBannerProps) {
  const titles = articles.map((a) => a.title_ja);

  return (
    <div
      className="overflow-hidden whitespace-nowrap flex items-center h-9 text-sm"
      style={{ background: '#1a1a2e' }}
    >
      <span
        className="shrink-0 px-3 text-xs font-bold tracking-widest mr-4 flex items-center gap-1.5"
        style={{ color: '#f87171' }}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse inline-block" />
        LIVE
      </span>
      <div className="overflow-hidden flex-1">
        <span className="inline-block animate-ticker text-white/70">
          {titles.join('　　·　　')}
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
          {titles.join('　　·　　')}
        </span>
      </div>
    </div>
  );
}
