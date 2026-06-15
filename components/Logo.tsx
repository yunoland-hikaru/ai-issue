'use client';

import Link from 'next/link';

type Size = 'md' | 'lg';

// ロゴクリック時に発火。ホーム(/[lang])に既にいる場合でも HomeView がタブ=全て＋スクロール最上部にリセットするための合図。
export const HOME_RESET_EVENT = 'ai-issue:home-reset';

// mark/word はクラスで指定（レスポンシブ対応）。lg はモバイル控えめ→sm以上で大きく。
const SIZES: Record<Size, { mark: string; word: string; gap: string }> = {
  md: { mark: 'h-[30px] w-[30px]', word: 'text-2xl', gap: 'gap-2.5' },
  lg: {
    mark: 'h-8 w-8 sm:h-[46px] sm:w-[46px]',
    word: 'text-2xl sm:text-[2.6rem]',
    gap: 'gap-2 sm:gap-3',
  },
};

/**
 * AI issue ブランドロゴ。
 * マーク = favicon と同じ「円＋上向き三角」。テーマ追従（円=テキスト色, 三角=背景色）で
 * ライトは黒丸/白三角、ダークは白丸/黒三角になり常に視認できる。
 * ワードマーク = Montserrat(太め, テスラ風のジオメトリック)。色はライト=黒/ダーク=白。
 * lg はモバイルでは小さめ、sm以上で大きく表示する。
 */
export default function Logo({
  size = 'md',
  href = '/',
  className = '',
  tone = 'auto',
}: {
  size?: Size;
  href?: string | null;
  className?: string;
  /** 'auto' = テーマ追従, 'onDark' = 常に白（暗い背景＝フッター用） */
  tone?: 'auto' | 'onDark';
}) {
  const s = SIZES[size];
  const circle = tone === 'onDark' ? '#ffffff' : 'var(--text-1)';
  const triangle = tone === 'onDark' ? '#0f0f1a' : 'var(--bg-nav)';
  const wordColor = tone === 'onDark' ? '#ffffff' : 'var(--text-1)';

  const inner = (
    <span className={`inline-flex items-center ${s.gap} ${className}`}>
      <svg viewBox="0 0 100 100" aria-hidden className={`${s.mark} shrink-0`}>
        <circle cx="50" cy="50" r="50" fill={circle} />
        <polygon points="50,27 73,69 27,69" fill={triangle} />
      </svg>
      <span
        className={`${s.word} leading-none`}
        style={{
          fontFamily: 'var(--font-montserrat), sans-serif',
          fontWeight: 800,
          letterSpacing: '-0.02em',
          color: wordColor,
        }}
      >
        AI&nbsp;issue
      </span>
    </span>
  );

  if (href === null) return inner;

  // ホームへ遷移 + スクロール最上部 + (ホームにいるなら)カテゴリタブを全てに戻す。
  function handleClick() {
    try {
      window.dispatchEvent(new CustomEvent(HOME_RESET_EVENT));
      window.scrollTo({ top: 0 });
    } catch { /* SSR等は無視 */ }
  }

  return (
    <Link href={href} onClick={handleClick} className="hover:opacity-80 transition-opacity" aria-label="AI issue">
      {inner}
    </Link>
  );
}
