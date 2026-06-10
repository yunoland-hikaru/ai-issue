import { NextRequest, NextResponse } from 'next/server';
import { anthropic } from '@/lib/claude';
import { getServiceClient } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const { articleId } = await req.json();
  if (!articleId) return NextResponse.json({ error: 'articleId required' }, { status: 400 });

  const supabase = getServiceClient();
  const { data: article, error } = await supabase
    .from('articles')
    .select('id, title_ja, summary_ja')
    .eq('id', articleId)
    .single();

  if (error || !article) {
    return NextResponse.json({ error: 'Article not found' }, { status: 404 });
  }

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `以下の日本語テキストを韓国語と英語に翻訳してください。

タイトル: ${article.title_ja}
要約: ${article.summary_ja}

JSONで返してください：
{
  "title_ko": "...",
  "title_en": "...",
  "summary_ko": "...",
  "summary_en": "..."
}`,
      },
    ],
  });

  const text = message.content[0].type === 'text' ? message.content[0].text : '{}';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  const translations = JSON.parse(jsonMatch?.[0] ?? '{}');

  await supabase.from('articles').update(translations).eq('id', articleId);

  return NextResponse.json({ ok: true, translations });
}
