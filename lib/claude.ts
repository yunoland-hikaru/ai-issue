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
以下の原文をもとに、読者にわかりやすく日本語の記事本文を作成してください。

元タイトル: ${title}
原文: ${content.slice(0, 3000)}

条件：
- title_ja: 元タイトルを自然な日本語に翻訳・意訳（30文字以内推奨）
- content_ja: 800〜1200文字の記事本文
  - 記者が書いたような自然な文体
  - 段落を<p>タグで区切って読みやすく
  - 重要な数字・発言はそのまま使用
  - 「AI要約」ではなく本文として作成
  - リードなし、本文から直接開始
  - 原文リンクは含めない
- image_prompt: content_jaの内容をもとにDALL-E 3で生成する画像のプロンプト（英語）
  - 記事内容を視覚的に表現
  - テキストなし
  - プロフェッショナルなニュース記事用
  - 16:9比率
- video_url: YouTubeや公式動画URLがあれば返す、なければnull
- category: 下記から1つ選択

JSON形式のみで返してください（他のテキスト不要）：
{
  "title_ja": "日本語のタイトル",
  "content_ja": "<p>段落1</p><p>段落2</p>...",
  "image_prompt": "DALL-E 3 image prompt in English based on the article content",
  "video_url": null,
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
