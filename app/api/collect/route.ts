import { NextRequest, NextResponse } from 'next/server';
import { fetchRssFeed, RSS_SOURCES } from '@/lib/rss';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getServiceClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? '');

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// POST /api/collect?source=0&limit=1
// source: index into RSS_SOURCES (0=AI Times, 1=TechCrunch, 2=VentureBeat, 3=The Verge)
// limit: max new articles to generate per call (default 1, max 3)
export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sourceIndex = parseInt(searchParams.get('source') ?? '0', 10);
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '1', 10), 3);

  const source = RSS_SOURCES[sourceIndex];
  if (!source) {
    return NextResponse.json(
      { error: `Invalid source index. Use 0–${RSS_SOURCES.length - 1}`, sources: RSS_SOURCES.map((s, i) => ({ i, name: s.name })) },
      { status: 400 },
    );
  }

  const supabase = getServiceClient();
  const results = { source: source.name, collected: 0, skipped: 0, errors: [] as string[] };

  let items;
  try {
    items = await fetchRssFeed(source);
  } catch (e) {
    return NextResponse.json({ error: `RSS fetch failed: ${String(e)}` }, { status: 500 });
  }

  for (const item of items) {
    if (results.collected >= limit) break;

    const { data: existing } = await supabase
      .from('articles')
      .select('id')
      .eq('source_url', item.url)
      .maybeSingle();

    if (existing) { results.skipped++; continue; }

    let generated: {
      title_ja: string;
      content_ja: string;
      image_url?: string | null;
      video_url?: string | null;
      category: string;
    };
    try {
      generated = await generateArticle(item.title, item.content, item.thumbnailUrl);
      if (results.collected + 1 < limit) await sleep(1000);
    } catch (e) {
      results.errors.push(`Generate failed: ${item.title} — ${String(e)}`);
      continue;
    }

    const { error } = await supabase.from('articles').insert({
      title_ja: generated.title_ja || item.title,
      title_en: item.title,
      content_ja: generated.content_ja,
      category: generated.category,
      source_url: item.url,
      source_name: item.sourceName,
      thumbnail_url: item.thumbnailUrl,
      image_url: generated.image_url ?? item.thumbnailUrl ?? null,
      video_url: generated.video_url ?? null,
      published_at: item.publishedAt,
    });

    if (error) {
      results.errors.push(`DB insert failed: ${item.url} — ${error.message}`);
    } else {
      results.collected++;
    }
  }

  return NextResponse.json(results);
}

async function generateArticle(title: string, content: string, thumbnailUrl?: string) {
  const model = genai.getGenerativeModel(
    { model: 'gemini-2.5-flash' },
    { apiVersion: 'v1beta' },
  );
  const prompt = `AI専門メディアの記者として、以下をJSON形式のみで返してください。

元タイトル: ${title}
原文: ${content.slice(0, 1500)}
${thumbnailUrl ? `画像URL: ${thumbnailUrl}` : ''}

{
  "title_ja": "日本語タイトル（25文字以内）",
  "content_ja": "<p>段落1</p><p>段落2</p><p>段落3</p>（400〜600文字）",
  "image_url": null,
  "video_url": null,
  "category": "AI産業|新ツール|研究・技術|規制・政策|半導体|AI企業"
}`;

  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { maxOutputTokens: 1024 },
  });
  const text = result.response.text();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  return JSON.parse(jsonMatch?.[0] ?? '{}');
}
