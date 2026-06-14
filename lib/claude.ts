import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Pull the first JSON object out of a model response and parse it.
function parseJson<T>(text: string, fallback: T): T {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return fallback;
  try {
    return JSON.parse(match[0]) as T;
  } catch {
    return fallback;
  }
}

export interface GeneratedArticle {
  title_ja: string;
  content_ja: string;
  summary_ja: string;
  image_keywords: string | null;
  image_prompt: string | null;
  company_domain: string | null;
  video_url: string | null;
  category: string;
}

// RSS原文 → 記者スタイルの日本語記事（本文・要約・画像プロンプト・カテゴリ）
export async function generateArticle(title: string, content: string): Promise<GeneratedArticle> {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 3072,
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
- summary_ja: 記事本文を3〜4文で要約（カード表示用、HTMLタグなしのプレーンテキスト）
- image_keywords: 無料ストック写真検索用の一般的な英語キーワード（2〜3語）
  - 記事テーマを表す一般語（例: "artificial intelligence", "data center", "semiconductor chip"）
  - 実在の企業名・人名・ブランド名は使わない
- image_prompt: content_jaの内容をもとに生成する画像のプロンプト（英語）
  - 記事の主題を象徴的・概念的に表現した抽象イラスト
  - 実在の人物・顔・著名人は描かない
  - 企業ロゴ・商標・ブランド名・製品の実物は含めない
  - 暴力・武器・流血・残虐など不快な描写は避ける
  - 文字・ロゴタイプ・透かしを含めない
  - クリーンでプロフェッショナルなエディトリアル風、16:9横長
- company_domain: 記事の主役となる企業の公式ドメイン（例: "openai.com", "anthropic.com", "nvidia.com"）。特定の企業が主役でなければ null
- video_url: YouTubeや公式動画URLがあれば返す、なければnull
- category: 下記から1つ選択

JSON形式のみで返してください（他のテキスト不要）：
{
  "title_ja": "日本語のタイトル",
  "content_ja": "<p>段落1</p><p>段落2</p>...",
  "summary_ja": "3〜4文のプレーンテキスト要約",
  "image_keywords": "english stock photo keywords",
  "image_prompt": "English prompt: abstract conceptual editorial illustration of the topic, no real people, no logos, no text",
  "company_domain": "openai.com or null",
  "video_url": null,
  "category": "AI産業 / 新ツール / 研究・技術 / 規制・政策 / 半導体 / AI企業 のいずれか1つ"
}`,
      },
    ],
  });

  const text = message.content[0].type === 'text' ? message.content[0].text : '';
  return parseJson<GeneratedArticle>(text, {
    title_ja: '',
    content_ja: '',
    summary_ja: '',
    image_keywords: null,
    image_prompt: null,
    company_domain: null,
    video_url: null,
    category: 'AI産業',
  });
}

export interface ArticleTranslation {
  title_ko: string;
  title_en: string;
  summary_ko: string;
  summary_en: string;
  content_ko: string;
  content_en: string;
}

// 日本語記事（タイトル・要約・本文）を韓国語・英語に翻訳
export async function translateArticle(
  titleJa: string,
  summaryJa: string,
  contentJa: string,
): Promise<ArticleTranslation> {
  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: `以下の日本語の記事を韓国語と英語に翻訳してください。
content（本文）のHTMLタグ（<p>など）は構造を保ったまま翻訳してください。

タイトル: ${titleJa}
要約: ${summaryJa}
本文: ${contentJa}

JSON形式のみで返してください（他のテキスト不要）：
{
  "title_ko": "...",
  "title_en": "...",
  "summary_ko": "...",
  "summary_en": "...",
  "content_ko": "<p>...</p>",
  "content_en": "<p>...</p>"
}`,
      },
    ],
  });

  const text = message.content[0].type === 'text' ? message.content[0].text : '';
  return parseJson<ArticleTranslation>(text, {
    title_ko: '',
    title_en: '',
    summary_ko: '',
    summary_en: '',
    content_ko: '',
    content_en: '',
  });
}
