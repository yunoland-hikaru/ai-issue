import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getServiceClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? '');

export async function POST() {
  const supabase = getServiceClient();

  const { data: articles, error } = await supabase
    .from('articles')
    .select('id, title_ja, summary_ja, thumbnail_url')
    .is('content_ja', null)
    .limit(10);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!articles || articles.length === 0) return NextResponse.json({ updated: 0, message: '対象記事なし' });

  const results = { updated: 0, errors: [] as string[] };

  for (const article of articles) {
    try {
      const generated = await generateContent(article.title_ja, article.summary_ja ?? '');

      const { error: updateError } = await supabase
        .from('articles')
        .update({
          content_ja: generated.content_ja,
          image_url: generated.image_url ?? article.thumbnail_url ?? null,
          video_url: generated.video_url ?? null,
        })
        .eq('id', article.id);

      if (updateError) {
        results.errors.push(`Update failed: ${article.id} — ${updateError.message}`);
      } else {
        results.updated++;
      }
    } catch (e) {
      results.errors.push(`Generate failed: ${article.title_ja} — ${String(e)}`);
    }
  }

  return NextResponse.json(results);
}

async function generateContent(title: string, summary: string) {
  const model = genai.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const prompt = `あなたはAI専門メディアの記者です。
以下のタイトルと要約をもとに、日本語の記事本文を作成してください。

タイトル: ${title}
要約: ${summary}

要件：
- 800〜1200文字程度の記事本文
- リードなし、本文から直接開始
- 段落を<p>タグで区切る
- AIの動向・背景・影響を深掘りして補足する
- 原文リンクは本文に含めない

JSON形式のみで返してください（他のテキスト不要）：
{
  "content_ja": "記事本文（<p>タグで段落区切り）",
  "image_url": null,
  "video_url": null
}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  return JSON.parse(jsonMatch?.[0] ?? '{}');
}
