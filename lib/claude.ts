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

// RSS原文の「事実」だけを抽出 → AI issue独自文体で新規作成した独立記事（文体ガイドライン準拠）
export async function generateArticle(title: string, content: string): Promise<GeneratedArticle> {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    system: `あなたはAIニュースメディア「AI issue」の編集者です。提供された原文から「事実(ファクト)」だけを抽出し、原文の文体・構成・言い回しを一切なぞらず、AI issue独自の文章で完全に書き直します。原文とは表現が大きく異なる、独立した著作物にすることが目的です。

【基本方針】
- 確認できた事実のみ記述。推測・噂・憶測は書かない（出典がある場合のみ「〜と発表した」「〜によると」で示す）
- 中立・簡潔。誇張・扇動・感嘆を避け、読者が自分で判断できるようにする
- 原文の段落構成や言い回しをコピーせず、事実だけを使って新しく組み立てる

【文章ルール】
- 逆ピラミッド：結論→背景→詳細の順
- 1文は40字以内を目安。1段落は3〜4文以内。曖昧な表現を避け、主語を明確にする
- 語尾は「〜した」「〜する」を基本に。「〜と思われる」「〜かもしれない」は使わない
- 専門用語は初出時に短く補足する（例: RAG（検索拡張生成））

【禁止表現】革命的 / 衝撃的 / 驚愕 / ヤバい / ついに / まさか / 信じられない / 〜と言われている / 〜らしい / 〜の模様 / 〜が期待される / 〜が注目されている

【カテゴリ別ニュアンス】AI産業=ビジネス・経済的影響中心で数値を明示 / AI技術=技術的正確さ優先・専門用語可 / 規制・政策=中立厳守`,
    messages: [
      {
        role: 'user',
        content: `次の原文から事実だけを抜き出し、ガイドラインに従って日本語の記事を新規作成してください。原文の言い回し・構成はコピーしないこと。

元タイトル: ${title}
原文: ${content.slice(0, 3000)}

条件：
- title_ja: 記事の核心の事実を30字以内で。主語＋動詞形式、疑問形(「〜か?」)は避ける（例:「OpenAI、推論特化モデル『o3』を正式リリース」）
- content_ja: 抽出した事実だけで新規作成した本文。3〜5段落、各段落を<p>タグで区切る。各段落は3〜4文、1文40字を目安。リード文は入れず本文から始める（リードはsummary_jaが担う）。原文にない数値・引用を捏造しない。原文リンクは含めない
- summary_ja: リード文として「誰が・何を・いつ・どこで・なぜ」を1〜2文で（カード表示用、HTMLタグなしのプレーンテキスト）
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
- 韓国語タグはハングル、英語タグはラテン文字で。日本語の文字（かな・漢字）を残さないこと。
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
【最重要】韓国語訳・英語訳には日本語の文字（ひらがな・カタカナ・漢字）を一切残さないこと。すべて対象言語へ完全に翻訳する。韓国語はハングルのみで表記し、漢字を混ぜない（例: 享受→누리다/향유、蒸留→증류、籍→적、あり方→본질/방식）。固有名詞は対象言語の慣用表記またはラテン文字を用いる。
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
