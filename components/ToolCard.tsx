'use client';

import { useState } from 'react';
import type { Tool } from '@/types';
import { useLang } from '@/contexts/LangContext';

const PRICING_COLORS: Record<string, { bg: string; color: string }> = {
  free:     { bg: '#052e16', color: '#4ade80' },
  paid:     { bg: '#1e1b4b', color: '#a5b4fc' },
  freemium: { bg: '#172554', color: '#60a5fa' },
};

interface ToolCardProps {
  tool: Tool;
}

export default function ToolCard({ tool }: ToolCardProps) {
  const { t } = useLang();
  const [upvoted, setUpvoted] = useState(false);
  const [count, setCount] = useState(tool.upvotes);
  const [loading, setLoading] = useState(false);
  const badge = PRICING_COLORS[tool.pricing_type] ?? PRICING_COLORS.free;
  const pricingLabel = t.pricing[tool.pricing_type] ?? tool.pricing_type;

  async function handleUpvote() {
    if (loading) return;
    const delta = upvoted ? -1 : 1;
    setLoading(true);
    setUpvoted((v) => !v);
    setCount((c) => c + delta);

    try {
      const res = await fetch('/api/upvote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toolId: tool.id, delta }),
      });
      if (res.ok) {
        const { upvotes } = await res.json();
        setCount(upvotes);
      }
    } catch {
      // revert on error
      setUpvoted((v) => !v);
      setCount((c) => c - delta);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-start gap-3 py-3 border-b border-white/5 last:border-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-semibold text-white">{tool.name}</span>
          <span
            className="text-xs px-1.5 py-0.5 rounded-md font-medium"
            style={{ background: badge.bg, color: badge.color }}
          >
            {pricingLabel}
          </span>
        </div>
        <p className="text-xs text-white/50 leading-relaxed line-clamp-2">{tool.description_ja}</p>
        <span className="text-xs text-white/30 mt-1 inline-block">{tool.category}</span>
      </div>
      <button
        onClick={handleUpvote}
        disabled={loading}
        className="shrink-0 flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg border transition-colors disabled:opacity-50"
        style={{
          borderColor: upvoted ? '#7F77DD' : 'rgba(255,255,255,0.1)',
          background: upvoted ? 'rgba(127,119,221,0.15)' : 'transparent',
          color: upvoted ? '#7F77DD' : 'rgba(255,255,255,0.4)',
        }}
      >
        <svg width="12" height="12" fill={upvoted ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="m5 15 7-7 7 7" />
        </svg>
        <span className="text-xs font-semibold">{count}</span>
      </button>
    </div>
  );
}
