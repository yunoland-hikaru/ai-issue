import Link from 'next/link';

type Size = 'md' | 'lg';

const SIZES: Record<Size, { mark: number; word: string; gap: string }> = {
  md: { mark: 30, word: 'text-2xl', gap: 'gap-2.5' },
  lg: { mark: 46, word: 'text-[2.6rem]', gap: 'gap-3' },
};

/**
 * AI issue ブランドロゴ。
 * マーク = favicon と同じ「円＋上向き三角」。テーマ追従（円=テキスト色, 三角=背景色）で
 * ライトは黒丸/白三角、ダークは白丸/黒三角になり常に視認できる。
 * ワードマーク = Montserrat(太め, テスラ風のジオメトリック)。色はライト=黒/ダーク=白。
 */
export default function Logo({
  size = 'md',
  href = '/',
  className = '',
}: {
  size?: Size;
  href?: string | null;
  className?: string;
}) {
  const s = SIZES[size];

  const inner = (
    <span className={`inline-flex items-center ${s.gap} ${className}`}>
      <svg
        width={s.mark}
        height={s.mark}
        viewBox="0 0 100 100"
        aria-hidden
        className="shrink-0"
      >
        <circle cx="50" cy="50" r="50" fill="var(--text-1)" />
        <polygon points="50,27 73,69 27,69" fill="var(--bg-nav)" />
      </svg>
      <span
        className={`${s.word} leading-none`}
        style={{
          fontFamily: 'var(--font-montserrat), sans-serif',
          fontWeight: 800,
          letterSpacing: '-0.02em',
          color: 'var(--text-1)',
        }}
      >
        AI&nbsp;issue
      </span>
    </span>
  );

  if (href === null) return inner;

  return (
    <Link href={href} className="hover:opacity-80 transition-opacity" aria-label="AI issue">
      {inner}
    </Link>
  );
}
