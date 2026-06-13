'use client';

import { useLang } from '@/contexts/LangContext';

const TAB_KEYS = ['top', 'news', 'tools', 'companies', 'policy', 'favorites'] as const;
type TabKey = typeof TAB_KEYS[number];

interface TabNavProps {
  active: TabKey;
  onChange: (tab: TabKey) => void;
}

export default function TabNav({ active, onChange }: TabNavProps) {
  const { t } = useLang();

  return (
    <div className="border-b border-white/10">
      <div className="max-w-6xl mx-auto px-4 flex gap-0 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {TAB_KEYS.map((key) => (
          <button
            key={key}
            onClick={() => onChange(key)}
            className="shrink-0 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors"
            style={{
              borderColor: active === key ? '#7F77DD' : 'transparent',
              color: active === key ? '#7F77DD' : 'rgba(255,255,255,0.5)',
            }}
          >
            {t.tabs[key]}
          </button>
        ))}
      </div>
    </div>
  );
}
