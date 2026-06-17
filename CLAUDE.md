@AGENTS.md

# AI issue — プロジェクト概要

AI関連ニュース/新着ツールを自動収集し、記者スタイルの日本語記事に変換して提供するメディアプラットフォーム。要件定義書: `C:\work\ai-issue要件定義書.txt`（リポジトリ外）。

## 技術スタック（実装ベース）

- フロント: Next.js 16 (App Router, Turbopack) + Tailwind CSS v4 + TypeScript
- DB: Supabase (PostgreSQL) / 画像: Supabase Storage `article-images` バケット（Public）
- 記事生成: Anthropic Claude `claude-sonnet-4-6`
- 翻訳(ko/en): Anthropic Claude `claude-haiku-4-5-20251001`
- 記事画像: ① Pexels無料ストック → ② OpenAI `gpt-image-1` フォールバック（ハイブリッド）
- 企業ロゴ: logo.dev（`LOGODEV_TOKEN`あり）→ DuckDuckGoアイコン（フォールバック）
- RSS: rss-parser / 自動化: GitHub Actions（newsroom方式: 1日12スロット・2時間毎/24時間、各85%確率で1本 → 約10本/日。米国の昼=JST深夜もカバー）
- フォント: `next/font/google`（Noto Sans JP/KR をセルフホスト）

## 記事生成フロー（`app/api/collect/route.ts`）

`POST /api/collect?source=0..3&limit=1..10`
1. `fetchRssFeed`（lib/rss.ts、各ソース最大10件）
2. `generateArticle`（lib/claude.ts）→ title_ja / content_ja / summary_ja / image_keywords / image_prompt / company_domain / video_url / category / hashtags_ja（重要キーワードのハッシュタグ5〜7個、#なし配列）
3. `translateArticle`（lib/claude.ts、haiku）→ title・summary・content・hashtags の ko/en（失敗してもja記事は保存）
4. 画像（著作権クリーン、RSS元画像は使わない）:
   - `searchStockImage`（lib/stock.ts、Pexels、image_keywordsで検索）→ 当たればその写真
   - 無ければ `generateImage`（lib/openai.ts、gpt-image-1、image_prompt）
   - どちらも Supabase Storage へ保存 → image_url
5. ロゴ: `logoUrlForDomain`（lib/logo.ts、company_domainから）→ logo_url（URLのみ、画像はホットリンク）
6. articles へ insert（created_at = 生成時刻）

X(Twitter)自動ポスト: 当初は公式API直投稿(`lib/x.ts`)を実装したが、2026年にX APIが従量課金化し無料投稿が402(CreditsDepleted)で不可に→撤去。代替として **英語RSSフィード `app/feed.xml/route.ts`** を提供し、外部の無料「RSS→X」サービス(dlvr.it等)に連携する方式に変更。フィードは英語(title_en/summary_en、/en/newsリンク)、最新30件、CDATA、画像はenclosure。

既存記事の補完: `POST /api/migrate-content`（content_ja=null を同パイプラインで埋める）。
既存ロゴの一括移行: `POST /api/migrate-logos`（保存済みDDG URL→logo.devに再構築、一回限りの管理用）。
画像の後追い補完: `POST /api/migrate-images?limit=1..10`（image_url=nullの記事に Pexels→AI で画像だけ保存。Storage upload失敗時の取りこぼし救済用。アップロードは2回リトライ）。
ハッシュタグの後追い生成: `POST /api/migrate-hashtags?limit=1..20`（hashtags_ja=nullの記事に `generateHashtags`(haiku)で ja/ko/en ハッシュタグだけ保存）。

## UI 配置

- ロゴ（`components/Logo.tsx`）: グラデーションバッジ（モノグラム "Ai"）+ 太いワードマーク「AI issue」（"issue"はアクセント#7F77DD）。Navbar・記事詳細ヘッダー共通。
- ヘッダー（`components/Navbar.tsx`）: ホームも記事詳細も**同一のNavbar**を使う。最上部の`TopDateBar`(sticky top-0)＋Navbar(sticky top-8)でスクロール時も両方固定（積み重ね）。モバイルもハンバーガー廃止で 検索/テーマ/言語/ログイン/ニュースレター を常時インライン表示。検索はデスクトップ=インラインSearchBox、モバイル=アイコン→SearchOverlay。
- ティッカー（`components/TickerBanner.tsx`）: 「LIVE」ラベルは廃止。見出しが流れるだけ。
- サイドバー（`components/Sidebar.tsx`）: ①ニュースレター（最上部）→ ②MOST POPULAR の2枚のみ。旧「今日の新着AIツール」「話題のキーワード」は廃止（dummyTools/dummyKeywords不使用に）。
- MOST POPULAR（`components/MostPopular.tsx`）: views降順の最大10件。1〜3位はアクセント#7F77DD塗りバッジ、4〜10位はグレー番号。`/api/articles?sort=popular&limit=10`。
- ホーム（`app/[lang]/page.tsx`）: **サーバーコンポーネント**（ISR `revalidate=300`）で最新20+人気10をSupabaseから取得→`HomeView.tsx`(client)に渡す（初期HTMLに記事を含めSEO対応）。最新生成記事が大きいヒーロー + 残りはリスト。記事0件なら「ただいま準備中です」空状態（ダミー記事は出さない）。タブ切替は取得済み記事のクライアント絞り込み。
- ホームのカード（HeroCard/NewsCard）: カテゴリタグは出さない。タイトルが主役、企業ロゴ+社名は時刻の隣にバイライン表示（例: Anthropic · 23分前）。
- フッター（`components/Footer.tsx`、layoutで全ページ共通）: 常時ダーク(#0f0f1a)。ロゴ(tone="onDark")+タグライン、ナビ(ホーム/ニュースレター)・インフォ(お問い合わせ/プライバシー/利用規約)リンク、コピーライト、トップへ戻るボタン。`/privacy`・`/terms`は準備中プレースホルダ(`components/ComingSoon.tsx`)。
- お問い合わせ（`/contact` → `POST /api/contact`）: 名前・メール・本文。contactsに保存(ベスト)＋Resendで`CONTACT_TO`へ転送(Reply-To=問い合わせ者)。管理者アドレスはenvのみで非公開。
- サービス紹介（`/about` → `app/[lang]/about/page.tsx`）: ja/ko/en。LegalPage+LegalContentで描画（内容は同ファイル内）。フッターにリンク。
- SEO/AdSense: `app/robots.ts`（/robots.txt, sitemap参照）, `app/sitemap.ts`（**ロケール別URL（/ja /ko /en）×（静的ルート+articles）＋各エントリに hreflang alternates**、revalidate 1h）, `app/[lang]/layout.tsx`に metadataBase/OpenGraph（既定値）。各ページは`generateMetadata`で canonical/hreflang/OG を個別出力。AdSenseローダーは**生<script>をheadに**（next/scriptはpreloadのみでcrawler検出不可だった）。
- 記事詳細（`app/[lang]/news/[id]/page.tsx`）: **サーバーコンポーネント**。`generateMetadata`で記事別 title/description（summary活用）/canonical/hreflang/OpenGraph（image_url, type=article）/Twitterカード（画像ありで`summary_large_image`）を出力 + `NewsArticle`のJSON-LD(`<script type=application/ld+json>`)を描画。UI/インタラクション（言語切替・閲覧数+1・関連記事取得）は`ArticleView.tsx`(client)に分離。開くと`/api/view`で閲覧数+1。上部にヒーロー画像（image_url）、メタ行に [カテゴリ][ロゴ+社名バッジ][時刻]、本文はそのまま流す。**関連記事は同カテゴリの実記事のみ（無ければセクション非表示。ダミーは出さない）**。

## 重要な実装判断・注意点（ハマりどころ）

- 記事本文(content_ja)は**単純翻訳でなく解説スタイル**: 事実＋背景・文脈＋意味/影響＋記者の抑制的な洞察1〜2文（E-E-A-T/リテンション重視）。ただし事実・数値・引用は原文に忠実、捏造禁止、事実と意見を書き分け。プロンプトは`lib/claude.ts`。長文化に伴いmax_tokens増(生成4096/翻訳8192)。
- 画像はハイブリッド。Pexels優先 → gpt-image-1フォールバック。`dall-e-3`はこのアカウントで権限なし（model does not exist）。gpt-image-1は`response_format`非対応（400）、base64返却、quality=medium（コスト約1/4）、1536x1024。
- 著作権: RSS元画像（第三者著作物）は保存も表示もしない。表示するのは Pexels（再配布OK）/ gpt-image（自社所有）/ 企業ロゴ（報道目的フェアユース）のみ。
- 画像失敗は collect の results.errors に積んで可視化（無言失敗を防ぐ）。
- 時刻は created_at（=生成時刻）。表示は**絶対日時**`formatDateTime(iso, lang)`（JST固定・言語別: ja「2026年6月14日 11:56」/ ko「2026년 6월 14일 11:56」/ en「Jun 14, 2026 11:56」）。KST=JST(UTC+9)なので韓国・日本で同一表示。旧`formatRelativeTime`(相対)は残置だが表示には未使用。最上部に最新記事日時の`TopDateBar`（layout、clientで`/api/articles?limit=1`取得）。
- 記事の並び順は created_at desc（最新生成がヒーロー）。`/api/articles`と関連記事クエリ両方。
- 多言語: 収集時に ko/en を全フィールド埋める。UIはlangで出し分け、未訳はjaフォールバック。
- **多言語ルーティングは「パスベース」(`/ja` `/ko` `/en`)**（SEO用にロケール別URLを分離。旧「単一URL＋Cookie/geoで出し分け」から移行済み）。
  - 全ページが `app/[lang]/` 配下。**ルートレイアウトも `app/[lang]/layout.tsx`**（`<html lang>`を動的化。`app/layout.tsx`は廃止）。`app/api`・`robots.ts`・`sitemap.ts`はルート直下のまま。
  - **`proxy.ts`（リポジトリ直下＝このNext16ではmiddlewareの新名称）** がロケール接頭辞の無いリクエストを検出→`/ja|ko|en`へ307リダイレクト。優先順: Cookie `lang`（手動選択）→ `x-vercel-ip-country`（KR→ko/JP→ja）→ **それ以外は既定 en（=x-default）**。matcherで`_next`・`api`・拡張子付きファイルは除外。旧`/news/[id]`共有リンクも自動リダイレクトで保存される。
  - 言語の正本はURL。`LangProvider`は`lang`をルートパラメータから受け取り、`setLang`はパスのロケール部を差し替えて`router.push`＋Cookie保存（ルート"/"再訪時にproxyが反映）。
  - **内部リンクは必ず `localePath(lang, path)`（`lib/i18n.ts`）でロケール接頭辞を付ける**（Navbar/Footer/HeroCard/NewsCard/MostPopular/SearchBox/SearchOverlay/ArticleView/contact・newsletter等）。
  - hreflangは各ページ`generateMetadata`の`alternates.languages`(ja/ko/en/x-default)で出力。
  - 注意: **ページ移動後は`.next`キャッシュを削除してからビルド**（`.next/dev/types/validator.ts`が旧パスを参照して型エラーになる）。ローカルはgeoヘッダ無し→既定 en。
- カテゴリは**3種のみ**: `AI産業`（企業・製品・投資・市場・半導体）/ `AI技術`（モデル・研究・新ツール）/ `規制・政策`。型は`ArticleCategory`、配色は`lib/categoryStyles.ts`、生成は`lib/claude.ts`のプロンプト。ホームのタブは 全て+この3つ（`TabNav`/`HomeView.tsx`の`categoryFilter`）。カテゴリ変更時はこの4箇所＋既存記事のDB移行を揃える。
- ロゴ社名はドメインから導出（`companyNameFromLogoUrl`）。主要AI企業はBRAND_NAMESで正式表記（OpenAI/NVIDIA等）。
- 既定テーマは常にライト（OS設定に追従しない）。`ThemeContext`は`useSyncExternalStore`（`<html>.dark`が正本、effect内setStateに戻さない）。
- RSS出典は著作権リスク回避のため**一次情報源（公開・拡散を意図した公式AIブログ/研究）のみ**: 0=OpenAI / 1=Google DeepMind / 2=Hugging Face / 3=arXiv(cs.AI)（`lib/rss.ts`）。二次ニュース媒体(TechCrunch等)や「AI学習・活用禁止」明記の媒体(旧AI Times)は使わない。rss-parserにUA設定済（UA無しだと403になる媒体があるため）。ソース増減時は collect.yml/route.ts の `RANDOM % N`・コメント・index範囲も揃える。

## DB スキーマ（追加済み列 — 無いとINSERTが落ちる）

ALTER TABLE articles ADD COLUMN IF NOT EXISTS content_ja text;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS content_ko text;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS content_en text;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS logo_url text;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS video_url text;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS views integer NOT NULL DEFAULT 0;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS hashtags_ja text[];
ALTER TABLE articles ADD COLUMN IF NOT EXISTS hashtags_ko text[];
ALTER TABLE articles ADD COLUMN IF NOT EXISTS hashtags_en text[];
-- ↑ 記事の重要キーワードのハッシュタグ(言語別)。記事ページ下部にチップ表示、英語(hashtags_en)はRSS(/feed.xml)経由でXツイートに付与。未追加でも収集は動く(null扱い)。
-- ↑ views: 記事閲覧数。MOST POPULARランキング(`/api/articles?sort=popular`)の元データ。
--   記事を開くと `/api/view` が+1。未追加でも sort=popular は新着順にフォールバックして動く。

-- ニュースレター申込フォーム(/newsletter)の追加項目。subscribers は email(unique) が既存。
ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS company text;
ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS title text;
ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS consent boolean DEFAULT false;
-- ↑ 未追加でも /api/subscribe は email のみで登録するフォールバックあり（フォームは壊れない）。

-- お問い合わせ(/contact → /api/contact)の保存先。未作成でもメール転送は動く（DB保存はベストエフォート）。
CREATE TABLE IF NOT EXISTS contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text, email text, message text,
  created_at timestamptz DEFAULT now()
);

## 環境変数（.env.local / Vercel 両方に）

`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `PEXELS_API_KEY`（無料ストック）, `LOGODEV_TOKEN`（高解像度ロゴ、pk_...）。
※ PEXELS_API_KEY/LOGODEV_TOKEN が無くても動く（ストック→AI生成、logo.dev→DDGにフォールバック）。GEMINI_API_KEY は廃止済み。

ニュースレター配信用: `RESEND_API_KEY`（Resend、ai-issue.com認証済み）, `NEWSLETTER_SECRET`（送信API認証＋配信停止トークン署名）, `NEWSLETTER_FROM`（既定 `AI issue <news@ai-issue.com>`）, `NEXT_PUBLIC_SITE_URL`（既定 `https://ai-issue.com`、メール内リンク用）。
お問い合わせ転送用: `CONTACT_TO`（管理者の受信アドレス＝公開コードに出さない）, `CONTACT_FROM`（既定 `AI issue <contact@ai-issue.com>`）。
※X自動ポストは公式APIの有料化により撤去。`X_*` env は不要（RSSフィード`/feed.xml`＋外部無料サービス方式）。

## ニュースレター（ダイジェスト配信）

- 申込: `/newsletter`（詳細フォーム: 氏名*・会社・役職・連絡先・メール*＋個人情報同意*）→ `/api/subscribe` → subscribers。
- 配信: `POST /api/newsletter/send`（`Authorization: Bearer NEWSLETTER_SECRET`）。cron-job.orgが毎日 **JST 08:00 = UTC 23:00**（cron `0 23 * * *`）に叩く。前日のJST 1日分(00〜24時)の記事をまとめ、Resendで購読者全員へ。各記事は `SITE_URL/news/[id]` へリンク。記事0件ならスキップ。
- 配信停止: メール内リンク → `GET /api/unsubscribe?e=&t=`（HMAC署名トークン検証 → subscribers削除）。
- ウィンドウ計算とHTML生成は `lib/newsletter.ts`。

## コスト目安

1記事 ≈ $0.11（Sonnet生成$0.032 + Haiku翻訳$0.013 + 画像: Pexels$0 or gpt-image medium$0.063）。
Pexelsヒット時は画像$0。約10本/日(12スロット)で月 ≈ $33前後（画像をlowにすればさらに低減）。

## 検証コマンド

- ビルド: `npm run build` / Lint: `npm run lint`（0 problems 維持）
- 収集手動テスト: dev起動後 `curl -X POST "http://localhost:3000/api/collect?source=1&limit=1"`
