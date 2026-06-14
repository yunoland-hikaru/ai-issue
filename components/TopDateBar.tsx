'use client';

import { useEffect, useState } from 'react';
import type { Article } from '@/types';
import { useLang } from '@/contexts/LangContext';
import { formatDateTime } from '@/lib/utils';

/** 最上部の細いバー: 最新記事の作成日時(年月日 時分)を表示。AI Timesの発行日表示に相当。 */
export default function TopDateBar() {
  const { t, lang } = useLang();
  const [latest, setLatest] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetch('/api/articles?limit=1')
      .then((r) => r.json())
      .then((d: Article[]) => { if (alive && Array.isArray(d) && d[0]) setLatest(d[0].created_at); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  return (
    <div className="sticky top-0 z-50 border-b" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-1)' }}>
      <div
        className="max-w-6xl mx-auto px-4 h-8 flex items-center justify-end text-xs"
        style={{ color: 'var(--text-4)' }}
      >
        {latest && <span>{t.sections.latestNews} · {formatDateTime(latest, lang)}</span>}
      </div>
    </div>
  );
}
