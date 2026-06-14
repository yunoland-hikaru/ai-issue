import Navbar from './Navbar';

/** プライバシー/利用規約など法務ページの共通レイアウト。 */
export default function LegalPage({
  title,
  effectiveDate,
  children,
}: {
  title: string;
  effectiveDate?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-page)' }}>
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
        <h1 className="text-2xl sm:text-3xl font-bold mb-1" style={{ color: 'var(--text-1)' }}>{title}</h1>
        {effectiveDate && (
          <p className="text-sm mb-8" style={{ color: 'var(--text-4)' }}>{effectiveDate}</p>
        )}
        <div className="legal">{children}</div>
      </main>
    </div>
  );
}
