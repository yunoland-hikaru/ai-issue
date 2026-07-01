'use client';

import { useLang } from '@/contexts/LangContext';

const TAB_KEYS = ['top', 'industry', 'tech', 'policy'] as const;
type TabKey = typeof TAB_KEYS[number];

interface TabNavProps {
  active: TabKey;
  onChange: (tab: TabKey) => void;
}

export default function TabNav({ active, onChange }: TabNavProps) {
  const { t } = useLang();

  return (
    <div className="border-b" style={{ borderColor: 'var(--border-1)' }}>
      <div className="max-w-6xl mx-auto px-4 flex gap-0 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {TAB_KEYS.map((key) => (
          <button
            key={key}
            onClick={() => onChange(key)}
            className="shrink-0 px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base font-medium border-b-2 transition-colors cursor-pointer"
            style={{
              borderColor: active === key ? 'var(--accent)' : 'transparent',
              color: active === key ? 'var(--accent)' : 'var(--text-2)',
            }}
            onMouseEnter={(e) => {
              if (active === key) return;
              e.currentTarget.style.color = 'var(--text-1)';
              e.currentTarget.style.borderColor = 'var(--border-1)';
            }}
            onMouseLeave={(e) => {
              if (active === key) return;
              e.currentTarget.style.color = 'var(--text-2)';
              e.currentTarget.style.borderColor = 'transparent';
            }}
          >
            {t.tabs[key]}
          </button>
        ))}
      </div>
    </div>
  );
}
