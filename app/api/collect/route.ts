import { NextResponse } from 'next/server';
import { fetchRssFeed, RSS_SOURCES } from '@/lib/rss';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getServiceClient } from '@/lib/supabase';

const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? '');

export const maxDuration = 60;

export async function POST() {
  const supabase = getServiceClient();
  const results = { collected: 0, errors: [] as string[] };

  for (const source of RSS_SOURCES) {
    let items;
    try {
      items = await fetchRssFeed(source);
    } catch (e) {
      results.errors.push(`RSS fetch failed: ${source.name} — ${String(e)}`);
      continue;
    }

    for (const item of items) {
      const { data: existing } = await supabase
        .from('articles')
        .select('id')
        .eq('source_url', item.url)
        .maybeSingle();

      if (existing) continue;

      let summary: { summary_ja: string; summary_en?: string; summary_ko?: string; category: string };
      try {
        summary = await generateSummary(item.title, item.content);
      } catch (e) {
        results.errors.push(`Summary failed: ${item.title} — ${String(e)}`);
        continue;
      }

      const { error } = await supabase.from('articles').insert({
        title_ja: item.title,
        title_en: item.title,
        summary_ja: summary.summary_ja,
        summary_en: summary.summary_en,
        summary_ko: summary.summary_ko,
        category: summary.category,
        source_url: item.url,
        source_name: item.sourceName,
        thumbnail_url: item.thumbnailUrl,
        published_at: item.publishedAt,
      });

      if (error) {
        results.errors.push(`DB insert failed: ${item.url} — ${error.message}`);
      } else {
        results.collected++;
      }
    }
  }

  return NextResponse.json(results);
}

async function generateSummary(title: string, content: string) {
  const model = genai.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const prompt = `以下のニュース記事を処理してください。

タイトル: ${title}
本文: ${content.slice(0, 2000)}

以下をJSON形式で返してください（他のテキスト不要）：
{
  "summary_ja": "日本語で3〜4文のわかりやすい要約",
  "summary_en": "3-4 sentence English summary",
  "summary_ko": "한국어로 3~4문장 요약",
  "category": "AI産業 / 新ツール / 研究・技術 / 規制・政策 / 半導体 / AI企業 のいずれか1つ"
}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  return JSON.parse(jsonMatch?.[0] ?? '{}');
}
