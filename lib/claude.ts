import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function summarizeArticle(title: string, content: string) {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `以下のニュース記事を日本語で3〜4文にわかりやすく要約してください。
専門用語は噛み砕いて説明し、読者がAIの知識がなくても理解できるようにしてください。

タイトル: ${title}
本文: ${content}

また、以下のカテゴリから最も適切なものを1つ選んでください：
AI産業 / 新ツール / 研究・技術 / 規制・政策 / 半導体 / AI企業

JSON形式で返してください：
{ "summary_ja": "...", "category": "..." }`,
      },
    ],
  });

  const text = message.content[0].type === 'text' ? message.content[0].text : '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  return JSON.parse(jsonMatch?.[0] ?? '{}') as { summary_ja: string; category: string };
}

export async function generateArticle(title: string, content: string, thumbnailUrl?: string) {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: `あなたはAI専門メディアの記者です。
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
- image_prompt: 記事内容に合ったDALL-E 3用の画像生成プロンプト（英語、テキストなし、プロフェッショナルなニュースサムネイル向け、16:9）
- YouTubeや公式動画URLがあればvideo_urlとして返す
- 原文リンクは本文に含めない

JSON形式のみで返してください（他のテキスト不要）：
{
  "title_ja": "日本語のタイトル",
  "content_ja": "記事本文（<p>タグで段落区切り）",
  "image_prompt": "DALL-E 3 image prompt in English",
  "video_url": "動画URL または null",
  "category": "AI産業 / 新ツール / 研究・技術 / 規制・政策 / 半導体 / AI企業 のいずれか1つ"
}`,
      },
    ],
  });

  const text = message.content[0].type === 'text' ? message.content[0].text : '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  return JSON.parse(jsonMatch?.[0] ?? '{}') as {
    title_ja: string;
    content_ja: string;
    image_prompt: string | null;
    video_url: string | null;
    category: string;
  };
}
