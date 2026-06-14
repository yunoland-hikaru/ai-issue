'use client';

import type { Article } from '@/types';
import MostPopular from './MostPopular';

interface SidebarProps {
  popular: Article[];
}

export default function Sidebar({ popular }: SidebarProps) {
  return (
    <aside className="w-full lg:w-72 lg:shrink-0 space-y-4 sm:space-y-5">
      {/* MOST POPULAR — 閲覧数ランキング（ニュースレターCTAはNavbarに常時表示） */}
      <MostPopular articles={popular} />
    </aside>
  );
}
