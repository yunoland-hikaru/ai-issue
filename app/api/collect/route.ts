import { NextResponse } from 'next/server';
import { fetchRssFeed, RSS_SOURCES } from '@/lib/rss';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getServiceClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? '');

export const maxDuration = 60;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

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

      let generated: {
        title_ja: string;
        content_ja: string;
        image_url?: string | null;
        video_url?: string | null;
        category: string;
      };
      try {
        generated = await generateArticle(item.title, item.content, item.thumbnailUrl);
        await sleep(2000); // レート制限対策: 2秒待機
      } catch (e) {
        results.errors.push(`Generate failed: ${item.title} — ${String(e)}`);
        await sleep(3000);
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
  }

  return NextResponse.json(results);
}

async function generateArticle(title: string, content: string, thumbnailUrl?: string) {
  const model = genai.getGenerativeModel({ model: 'gemini-2.5-flash' });
  const prompt = `あなたはAI専門メディアの記者です。
以下の原文をもとに、日本語の記事タイトルと本文を作成してください。

元タイトル: ${title}
原文: ${content.slice(0, 3000)}
${thumbnailUrl ? `サムネイル画像URL: ${thumbnailUrl}` : ''}

要件：
- title_ja: 元タイトルを自然な日本語に翻訳・意訳（30文字以内推奨）
- content_ja: 800〜1200文字程度の記事本文
- リードなし、本文から直接開始
- 段落を<p>タグで区切る
- 原文にある引用や発言はそのまま引用として使用
- 関連する画像URLがあればimage_urlとして返す（原文内の画像URLを探す）
- YouTubeや公式動画URLがあればvideo_urlとして返す
- 原文リンクは本文に含めない

JSON形式のみで返してください（他のテキスト不要）：
{
  "title_ja": "日本語のタイトル",
  "content_ja": "記事本文（<p>タグで段落区切り）",
  "image_url": "画像URL または null",
  "video_url": "動画URL または null",
  "category": "AI産業 / 新ツール / 研究・技術 / 規制・政策 / 半導体 / AI企業 のいずれか1つ"
}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  return JSON.parse(jsonMatch?.[0] ?? '{}');
}
