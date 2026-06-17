// 無料ストック写真(Pexels)を検索して画像バイトを返す。
// ライセンス: 商用利用・改変・再配布が許可（クレジット不要、推奨）。
// PEXELS_API_KEY 未設定や該当なしの場合は null を返し、呼び出し側がAI生成にフォールバックする。

export interface StockResult {
  buffer: Buffer;
  sourceId: string; // Pexels写真ID（記事間の重複回避に使う）
}

// excludeIds: 既に他の記事で使ったPexels写真ID。可能な限りこれら以外から選ぶ（同じ画像の使い回しを防ぐ）。
export async function searchStockImage(query: string, excludeIds: string[] = []): Promise<StockResult | null> {
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey || !query.trim()) return null;

  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=30&orientation=landscape`,
      { headers: { Authorization: apiKey } },
    );
    if (!res.ok) {
      console.error(`Pexels search failed: HTTP ${res.status}`);
      return null;
    }

    const data = (await res.json()) as { photos?: { id?: number; src?: Record<string, string> }[] };
    const photos = data.photos ?? [];
    if (photos.length === 0) return null;

    // 既に使われた写真を除外。全部除外されてしまう場合は元の候補にフォールバック。
    const exclude = new Set(excludeIds.map(String));
    const pool = photos.filter((p) => p.id != null && !exclude.has(String(p.id)));
    const candidates = pool.length > 0 ? pool : photos;

    // 候補からランダムに1枚選んで多様性を出す
    const photo = candidates[Math.floor(Math.random() * candidates.length)];
    const url = photo?.src?.large2x ?? photo?.src?.large ?? photo?.src?.original;
    if (!url || photo?.id == null) return null;

    const imgRes = await fetch(url);
    if (!imgRes.ok) {
      console.error(`Pexels image download failed: HTTP ${imgRes.status}`);
      return null;
    }
    return { buffer: Buffer.from(await imgRes.arrayBuffer()), sourceId: String(photo.id) };
  } catch (e) {
    console.error('Pexels search failed:', e);
    return null;
  }
}
