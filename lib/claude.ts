import Anthropic from '@anthropic-ai/sdk';

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

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
  return JSON.parse(text) as { summary_ja: string; category: string };
}
