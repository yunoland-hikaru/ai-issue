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
    max_tokens: 6144,
    system: `あなたはAIニュースメディア「AI issue」の編集者です。提供された原文から「事実(ファクト)」だけを抽出し、原文の文体・構成・言い回しを一切なぞらず、AI issue独自の文章で完全に書き直します。原文とは表現が大きく異なる、独立した著作物にすることが目的です。

【基本方針】
- 確認できた事実のみ記述。推測・噂・憶測は書かない（出典がある場合のみ「〜と発表した」「〜によると」で示す）
- 中立・簡潔・わかりやすさ。誇張・扇動・感嘆を避け、読者が自分で判断できるようにする
- 原文の段落構成や言い回しをコピーせず、事実だけを使って新しく組み立てる
- 単なる事実の要約で終わらせない。事実に「背景・文脈」と「意味づけ（なぜ重要か）」を必ず加え、読者がその事実から得られる理解を一段深める独自の価値を持たせる
  - 【事実とそれ以外の線引き】具体的な数値・固有名詞・発言・日付・実績は原文で確認できたものだけを書く（捏造・誇張・誤った換算は厳禁）。一方で「背景・文脈」「なぜ重要か」「今後どこに注目すべきか」は、AI分野で一般に知られた前提知識と、確認できた事実から無理なく導ける論理的な含意の範囲で書く。具体的な未確認の数値・固有名詞・予測値をでっち上げてはならない。断定せず「〜と位置づけられる」「〜という見方ができる」程度の控えめな表現にとどめる

【わかりやすさ・トーン（最重要）】AI issueのモットーは「やさしく、読みやすく」。
- AIに詳しくない一般読者が一読で理解できることを最優先する
- 専門用語や数値を並べた「仕様書・論文」調にしない。事実を述べるだけでなく、それが「なぜ重要か」「何が新しいか」「読者や利用者にとって何を意味するか」を、身近な言葉でかみ砕いて説明する
- 固すぎず軽薄でもない、信頼できる解説者の語り口（NHKの解説のように、誇張せず噛み砕いて伝える）
- 難しい概念は言い換えや短いたとえで補い、まず意味・結論を示してから詳細に入る
- 1文に事実や数値を詰め込みすぎない。専門用語を連発せず、読者の理解の流れに沿ってひと息で読めるリズムにする

【文章ルール】
- 逆ピラミッド＋意味づけ：結論→背景・文脈→詳細→意味づけ（なぜ重要か・今後の見方）の順で組み立てる
- 読みやすさを最優先。短文を機械的に並べてブツ切りにせず、接続詞（また/一方/このため/さらに/その上で 等）で文と文を自然につなぎ、文の長短に変化をつけて流れるように書く
- 1文は長くなりすぎない（目安40〜60字）。ただし箇条書きのように細切れにはしない
- 1段落は3〜5文で1つの論点にまとめ、段落から段落へも話の流れがつながるようにする
- 語尾は「〜した」「〜する」を基本に。同じ語尾が3回以上連続しないよう変化をつける。「〜と思われる」「〜かもしれない」は使わない
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
- title_ja: 記事の核心を簡潔に。20〜25字を目安に、長くても全角30字以内（厳守）。二次的要素＝パラメータ数・性能数値・ライセンス名・バージョン番号・補足修飾は削り、「主語＋核心の動作」だけに絞る。疑問形(「〜か?」)は避ける
  - 悪い例（長すぎ・要素過多）:「Z.ai、7530億パラメータの『GLM-5.2』をMITライセンスで公開」
  - 良い例（核心だけ）:「Z.ai、オープンLLM『GLM-5.2』を公開」「OpenAI、推論特化モデル『o3』を正式リリース」
- content_ja: 抽出した事実をもとに新規作成した本文。6〜7段落・合計1400〜2000字程度、各段落を<p>タグで区切る。各段落は3〜5文。文と文は接続詞で自然につなぎ、細切れの短文を並べない（流れるように読ませる）。専門用語や数値を羅列せず、その意味や背景をやさしく補いながら書く。リード文は入れず本文から始める（リードはsummary_jaが担う）。原文にない数値・引用を捏造しない。原文リンクは含めない
  - 構成：①結論（何が起きたか）→ ②背景・文脈（どんな経緯・流れの中での出来事か、関連する状況）→ ③詳細（確認できた事実の具体）→ ④意味づけ（なぜ重要か／読者・利用者・業界にとって何を意味するか／今後どこに注目すべきか）。②と④は単なる事実の繰り返しにならないよう、事実に解釈を一段加えて独自の価値を出す
  - ②背景・文脈と④意味づけでは、確認できた事実とAI分野の一般的な前提知識から無理なく導ける範囲で書き、未確認の具体的数値・固有名詞・予測値は作らない。「〜と位置づけられる」「〜という見方ができる」など断定を避けた控えめな表現にする
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

// ko/en 訳に残った日本語の文字（ひらがな・カタカナ・CJK漢字）を数える。
// 正しく訳されていれば韓国語=ハングル＋ラテン固有名詞、英語=ラテンのみで、これらは0になる。
// >0 は「訳し漏れ」を意味する（例: 韓国語に「研究」「開発」等の漢字が残る）。
const JP_RESIDUE_RE = /[぀-ヿ一-鿿]/g;
function jpResidueCount(t: ArticleTranslation): number {
  return [t.title_ko, t.summary_ko, t.content_ko, t.title_en, t.summary_en, t.content_en]
    .reduce((n, s) => n + ((s || '').match(JP_RESIDUE_RE)?.length ?? 0), 0);
}

// 与えた文字列のいずれかに日本語の文字（かな・CJK漢字）が含まれるか。
// ko/en フィールドに使い、翻訳漏れ（例: 韓国語に「研究」「開発」が残る）の検出に使う。
export function hasJpResidue(...vals: (string | null | undefined)[]): boolean {
  return vals.some((s) => !!s && !!s.match(JP_RESIDUE_RE));
}

// 日本語記事（タイトル・要約・本文・ハッシュタグ）を韓国語・英語に翻訳。
// retryOnResidue=true のときだけ、ko/en に日本語の文字が残った場合に一度強めて再試行する。
//   - collect/migrate-content（Vercel 60秒のホットパス）は false（Haiku 1回のみ＝高速）。
//     訳し漏れ・空訳は後追いの POST /api/migrate-translations が拾って修正する。
//   - migrate-translations（訳し漏れ修正が本業の非同期バックストップ）は true で呼ぶ。
// ※ 以前は常に再試行していたが、本文長文化と相まって 1記事の生成が 60秒を超えて
//   collect が頻繁にタイムアウトしていたため、ホットパスでは再試行を切る。
export async function translateArticle(
  titleJa: string,
  summaryJa: string,
  contentJa: string,
  hashtagsJa: string[] = [],
  opts: { retryOnResidue?: boolean } = {},
): Promise<ArticleTranslation> {
  const result = await runTranslation(titleJa, summaryJa, contentJa, hashtagsJa, false);
  if (!opts.retryOnResidue) return result; // 高速パス: 再試行しない（後追いで補正）
  const empty = !result.content_ko && !result.content_en; // JSON解析失敗（崩れた出力）
  // 訳し漏れ無し かつ 中身あり ならそのまま採用。
  if (!empty && jpResidueCount(result) === 0) return result;
  // 日本語が残った or 解析失敗で空 → 強い注意を付けて1回だけ再翻訳。
  const retry = await runTranslation(titleJa, summaryJa, contentJa, hashtagsJa, true);
  const retryEmpty = !retry.content_ko && !retry.content_en;
  if (retryEmpty) return result;        // 再試行も空なら最初の結果（壊さない）
  if (empty) return retry;              // 最初が空・再試行は中身あり → 再試行を採用
  return jpResidueCount(retry) < jpResidueCount(result) ? retry : result;
}

async function runTranslation(
  titleJa: string,
  summaryJa: string,
  contentJa: string,
  hashtagsJa: string[],
  strict: boolean,
): Promise<ArticleTranslation> {
  const strictNote = strict
    ? `\n【再翻訳・厳守】前回の訳に日本語の漢字・かなが残っていました。今回は韓国語訳・英語訳に漢字・ひらがな・カタカナを一文字も残さないこと。固有名詞（企業/製品/サービス/モデル名）はラテン文字のまま、それ以外の漢字語はすべて対象言語の語に置き換える（韓国語はハングル、英語は英単語）。`
    : '';
  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 12000,
    messages: [
      {
        role: 'user',
        content: `以下の日本語の記事を韓国語と英語に翻訳してください。${strictNote}
【最重要1】韓国語訳・英語訳には日本語の文字（ひらがな・カタカナ・漢字）を一切残さないこと。すべて対象言語へ完全に翻訳する。韓国語の地の文はハングルのみで表記し、漢字を混ぜない（例: 享受→누리다/향유、蒸留→증류、籍→적、あり方→본질/방식）。
【最重要2】韓国語訳では、企業名・製品名・サービス名・ブランド名・モデル名などの固有名詞は、原則ラテン文字（英語表記）のままにする。ハングルに音訳しない（例: Microsoft→Microsoft（×마이크로소프트）、Copilot→Copilot（×코파일럿）、DeepSeek→DeepSeek（×딥시크）、OpenAI→OpenAI、GPT-5→GPT-5、NVIDIA→NVIDIA）。ただし「인공지능」「반도체」のような一般名詞・一般化した外来語はハングルで自然に表記する。英語訳でも固有名詞はそのままラテン文字で。
【数値注意】日本語の数の単位「億」「万」「兆」を機械的に置き換えない。実際の数量を保ったまま各言語へ換算する（例: 7530億→ko「7530억」/en「753 billion」。誤って「753조(=753兆)」「753 trillion」にしない）。数値・単位は原文の事実から変えないこと。
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
