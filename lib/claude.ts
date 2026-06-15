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
  hashtags_ja: string[];
}

// RSS原文 → 記者スタイルの日本語記事（本文・要約・画像プロンプト・カテゴリ）
export async function generateArticle(title: string, content: string): Promise<GeneratedArticle> {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: `あなたはAI専門メディアの記者です。
以下の原文をもとに、読者にわかりやすく日本語の記事本文を作成してください。

元タイトル: ${title}
原文: ${content.slice(0, 3000)}

条件：
- title_ja: 元タイトルを自然な日本語に翻訳・意訳（30文字以内推奨）
- content_ja: 900〜1400文字の、プロの記者が書く「解説記事」の本文
  - 単なる原文の翻訳・要約ではなく、再構成して付加価値を出す：
    1) 何が起きたか（事実） 2) 背景・文脈（なぜ今か、これまでの経緯） 3) 意味・影響（業界・ユーザー・競合にとって何を意味するか）
  - 記者としての抑制的な洞察・展望を1〜2文添える（例:「〜と見られる」「今後は〜が焦点になりそうだ」）。事実と意見・推測は明確に書き分ける
  - 事実・数字・固有名詞・発言は原文に忠実に。原文にない具体的な数値や引用を捏造しない。不確かな点は断定しない
  - 段落を<p>タグで区切って読みやすく。記者らしい自然な文体、リードなしで本文から直接開始
  - 「AI要約」ではなく一本の記事として作成。原文リンクは含めない
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
- category: 記事内容に最も近いものを下記3つから1つ選択
  - "AI産業": 企業・製品・サービス・投資・市場・半導体などのビジネス/業界動向
  - "AI技術": モデル・研究成果・新しいAIツール・技術的ブレイクスルー
  - "規制・政策": 政府・法規制・倫理・安全性・政策に関する話題
- hashtags_ja: 記事の重要キーワード・トピックのハッシュタグを5〜7個（文字列の配列）
  - #は付けない。各タグは空白を含まない単語（例: "生成AI", "LLM", "RAG", "AIエージェント", "半導体"）
  - 一般的で検索されやすい語を選ぶ。固有名詞も可（例: "OpenAI"）

JSON形式のみで返してください（他のテキスト不要）：
{
  "title_ja": "日本語のタイトル",
  "content_ja": "<p>段落1</p><p>段落2</p>...",
  "summary_ja": "3〜4文のプレーンテキスト要約",
  "image_keywords": "english stock photo keywords",
  "image_prompt": "English prompt: abstract conceptual editorial illustration of the topic, no real people, no logos, no text",
  "company_domain": "openai.com or null",
  "video_url": null,
  "category": "AI産業 / AI技術 / 規制・政策 のいずれか1つ",
  "hashtags_ja": ["生成AI", "LLM", "RAG"]
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
    hashtags_ja: [],
  });
}

// 既存記事のハッシュタグだけを生成（ja/ko/en同時、本文は変更しない）。バックフィル用。
export async function generateHashtags(
  titleJa: string,
  summaryJa: string,
): Promise<{ ja: string[]; ko: string[]; en: string[] }> {
  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 512,
    messages: [
      {
        role: 'user',
        content: `次の記事の重要キーワード・トピックのハッシュタグを日本語・韓国語・英語でそれぞれ5〜7個生成してください。
- #は付けない。各タグは空白を含まない単語。
- 英語は複数語ならPascalCase（例: "MachineLearning"）、一般的な略語はそのまま（例: "LLM", "RAG", "AI"）。
- 3言語は同じ概念・同じ個数・同じ順序で対応させる。

タイトル: ${titleJa}
要約: ${summaryJa}

JSON形式のみで返してください：
{"ja":["生成AI","LLM"],"ko":["생성AI","LLM"],"en":["GenerativeAI","LLM"]}`,
      },
    ],
  });
  const text = message.content[0].type === 'text' ? message.content[0].text : '';
  return parseJson<{ ja: string[]; ko: string[]; en: string[] }>(text, { ja: [], ko: [], en: [] });
}

export interface ArticleTranslation {
  title_ko: string;
  title_en: string;
  summary_ko: string;
  summary_en: string;
  content_ko: string;
  content_en: string;
  hashtags_ko: string[];
  hashtags_en: string[];
}

// 日本語記事（タイトル・要約・本文・ハッシュタグ）を韓国語・英語に翻訳
export async function translateArticle(
  titleJa: string,
  summaryJa: string,
  contentJa: string,
  hashtagsJa: string[] = [],
): Promise<ArticleTranslation> {
  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 8192,
    messages: [
      {
        role: 'user',
        content: `以下の日本語の記事を韓国語と英語に翻訳してください。
content（本文）のHTMLタグ（<p>など）は構造を保ったまま翻訳してください。
hashtags は各言語のハッシュタグ語に変換（#は付けない、空白を含まない単語。英語は複数語ならPascalCase 例: "MachineLearning"。一般的な略語はそのまま 例: "LLM", "RAG", "AI"）。配列の要素数・順序は元と揃える。

タイトル: ${titleJa}
要約: ${summaryJa}
本文: ${contentJa}
ハッシュタグ(ja): ${JSON.stringify(hashtagsJa)}

JSON形式のみで返してください（他のテキスト不要）：
{
  "title_ko": "...",
  "title_en": "...",
  "summary_ko": "...",
  "summary_en": "...",
  "content_ko": "<p>...</p>",
  "content_en": "<p>...</p>",
  "hashtags_ko": ["..."],
  "hashtags_en": ["..."]
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
    hashtags_ko: [],
    hashtags_en: [],
  });
}
