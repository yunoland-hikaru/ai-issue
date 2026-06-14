// 無料ストック写真(Pexels)を検索して画像バイトを返す。
// ライセンス: 商用利用・改変・再配布が許可（クレジット不要、推奨）。
// PEXELS_API_KEY 未設定や該当なしの場合は null を返し、呼び出し側がAI生成にフォールバックする。
export async function searchStockImage(query: string): Promise<Buffer | null> {
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey || !query.trim()) return null;

  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=15&orientation=landscape`,
      { headers: { Authorization: apiKey } },
    );
    if (!res.ok) {
      console.error(`Pexels search failed: HTTP ${res.status}`);
      return null;
    }

    const data = (await res.json()) as { photos?: { src?: Record<string, string> }[] };
    const photos = data.photos ?? [];
    if (photos.length === 0) return null;

    // 上位結果からランダムに1枚選んで多様性を出す
    const photo = photos[Math.floor(Math.random() * photos.length)];
    const url = photo?.src?.large2x ?? photo?.src?.large ?? photo?.src?.original;
    if (!url) return null;

    const imgRes = await fetch(url);
    if (!imgRes.ok) {
      console.error(`Pexels image download failed: HTTP ${imgRes.status}`);
      return null;
    }
    return Buffer.from(await imgRes.arrayBuffer());
  } catch (e) {
    console.error('Pexels search failed:', e);
    return null;
  }
}
