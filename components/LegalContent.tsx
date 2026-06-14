import type { LegalBlock } from '@/lib/legalContent';

/** LegalBlock[] を .legal 内のセマンティックHTMLに描画。テキストは式で出力（自動エスケープ）。 */
export default function LegalContent({ blocks }: { blocks: LegalBlock[] }) {
  return (
    <>
      {blocks.map((b, i) => {
        if (b.t === 'h2') return <h2 key={i}>{b.text}</h2>;
        if (b.t === 'p') return <p key={i}>{b.text}</p>;
        if (b.t === 'ul') {
          return (
            <ul key={i}>
              {b.items.map((it, j) => <li key={j}>{it}</li>)}
            </ul>
          );
        }
        // table
        return (
          <table key={i}>
            <thead>
              <tr>{b.head.map((h, j) => <th key={j}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {b.rows.map((row, r) => (
                <tr key={r}>{row.map((c, j) => <td key={j}>{c}</td>)}</tr>
              ))}
            </tbody>
          </table>
        );
      })}
    </>
  );
}
