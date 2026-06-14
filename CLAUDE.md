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
- RSS: rss-parser / 自動化: GitHub Actions（newsroom方式: 1日8スロット、各85%確率で1本 → 5〜10本/日）
- フォント: `next/font/google`（Noto Sans JP/KR をセルフホスト）

## 記事生成フロー（`app/api/collect/route.ts`）

`POST /api/collect?source=0..3&limit=1..10`
1. `fetchRssFeed`（lib/rss.ts、各ソース最大10件）
2. `generateArticle`（lib/claude.ts）→ title_ja / content_ja / summary_ja / image_keywords / image_prompt / company_domain / video_url / category
3. `translateArticle`（lib/claude.ts、haiku）→ title・summary・content の ko/en（失敗してもja記事は保存）
4. 画像（著作権クリーン、RSS元画像は使わない）:
   - `searchStockImage`（lib/stock.ts、Pexels、image_keywordsで検索）→ 当たればその写真
   - 無ければ `generateImage`（lib/openai.ts、gpt-image-1、image_prompt）
   - どちらも Supabase Storage へ保存 → image_url
5. ロゴ: `logoUrlForDomain`（lib/logo.ts、company_domainから）→ logo_url（URLのみ、画像はホットリンク）
6. articles へ insert（created_at = 生成時刻）

既存記事の補完: `POST /api/migrate-content`（content_ja=null を同パイプラインで埋める）。
既存ロゴの一括移行: `POST /api/migrate-logos`（保存済みDDG URL→logo.devに再構築、一回限りの管理用）。

## UI 配置

- ロゴ（`components/Logo.tsx`）: グラデーションバッジ（モノグラム "Ai"）+ 太いワードマーク「AI issue」（"issue"はアクセント#7F77DD）。Navbar・記事詳細ヘッダー共通。
- ヘッダー（`components/Navbar.tsx`）: ホームも記事詳細も**同一のNavbar**を使う（記事詳細の旧「トップへ戻る」専用ヘッダーは廃止）。
- ティッカー（`components/TickerBanner.tsx`）: 「LIVE」ラベルは廃止。見出しが流れるだけ。
- サイドバー（`components/Sidebar.tsx`）: ①ニュースレター（最上部）→ ②MOST POPULAR の2枚のみ。旧「今日の新着AIツール」「話題のキーワード」は廃止（dummyTools/dummyKeywords不使用に）。
- MOST POPULAR（`components/MostPopular.tsx`）: views降順の最大10件。1〜3位はアクセント#7F77DD塗りバッジ、4〜10位はグレー番号。`/api/articles?sort=popular&limit=10`。
- ホーム（`app/page.tsx`）: 最新生成記事が大きいヒーロー + 残りはリスト。記事0件なら「ただいま準備中です」空状態（ダミー記事は出さない）。
- ホームのカード（HeroCard/NewsCard）: カテゴリタグは出さない。タイトルが主役、企業ロゴ+社名は時刻の隣にバイライン表示（例: Anthropic · 23分前）。
- 記事詳細（`app/news/[id]/page.tsx`）: 開くと`/api/view`で閲覧数+1。上部にヒーロー画像（image_url）、メタ行に [カテゴリ][ロゴ+社名バッジ][時刻]、本文はそのまま流す（本文中央への画像/ロゴ挿入は廃止）。

## 重要な実装判断・注意点（ハマりどころ）

- 画像はハイブリッド。Pexels優先 → gpt-image-1フォールバック。`dall-e-3`はこのアカウントで権限なし（model does not exist）。gpt-image-1は`response_format`非対応（400）、base64返却、quality=medium（コスト約1/4）、1536x1024。
- 著作権: RSS元画像（第三者著作物）は保存も表示もしない。表示するのは Pexels（再配布OK）/ gpt-image（自社所有）/ 企業ロゴ（報道目的フェアユース）のみ。
- 画像失敗は collect の results.errors に積んで可視化（無言失敗を防ぐ）。
- 時刻は created_at（=生成時刻）。`formatRelativeTime`は軽微なクロックスキューを0にクランプ→生成直後は「0分前」。<1h:分前 / <24h:時間前 / >=24h:M月D日(JST)。
- 記事の並び順は created_at desc（最新生成がヒーロー）。`/api/articles`と関連記事クエリ両方。
- 多言語: 収集時に ko/en を全フィールド埋める。UIはlangで出し分け、未訳はjaフォールバック。
- ロゴ社名はドメインから導出（`companyNameFromLogoUrl`）。主要AI企業はBRAND_NAMESで正式表記（OpenAI/NVIDIA等）。
- 既定テーマは常にライト（OS設定に追従しない）。`ThemeContext`は`useSyncExternalStore`（`<html>.dark`が正本、effect内setStateに戻さない）。
- RSS source=0 (AI Times)は韓国語。原文タイトルをtitle_enに入れない（翻訳結果を使う）。

## DB スキーマ（追加済み列 — 無いとINSERTが落ちる）

ALTER TABLE articles ADD COLUMN IF NOT EXISTS content_ja text;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS content_ko text;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS content_en text;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS logo_url text;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS video_url text;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS views integer NOT NULL DEFAULT 0;
-- ↑ views: 記事閲覧数。MOST POPULARランキング(`/api/articles?sort=popular`)の元データ。
--   記事を開くと `/api/view` が+1。未追加でも sort=popular は新着順にフォールバックして動く。

-- ニュースレター申込フォーム(/newsletter)の追加項目。subscribers は email(unique) が既存。
ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS company text;
ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS title text;
ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS consent boolean DEFAULT false;
-- ↑ 未追加でも /api/subscribe は email のみで登録するフォールバックあり（フォームは壊れない）。

## 環境変数（.env.local / Vercel 両方に）

`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `PEXELS_API_KEY`（無料ストック）, `LOGODEV_TOKEN`（高解像度ロゴ、pk_...）。
※ PEXELS_API_KEY/LOGODEV_TOKEN が無くても動く（ストック→AI生成、logo.dev→DDGにフォールバック）。GEMINI_API_KEY は廃止済み。

ニュースレター配信用: `RESEND_API_KEY`（Resend、ai-issue.com認証済み）, `NEWSLETTER_SECRET`（送信API認証＋配信停止トークン署名）, `NEWSLETTER_FROM`（既定 `AI issue <news@ai-issue.com>`）, `NEXT_PUBLIC_SITE_URL`（既定 `https://ai-issue.com`、メール内リンク用）。

## ニュースレター（ダイジェスト配信）

- 申込: `/newsletter`（詳細フォーム: 氏名*・会社・役職・連絡先・メール*＋個人情報同意*）→ `/api/subscribe` → subscribers。
- 配信: `POST /api/newsletter/send`（`Authorization: Bearer NEWSLETTER_SECRET`）。cron-job.orgが毎日 **JST 08:00 = UTC 23:00**（cron `0 23 * * *`）に叩く。前日 JST 08〜22時の記事をまとめ、Resendで購読者全員へ。各記事は `SITE_URL/news/[id]` へリンク。記事0件ならスキップ。
- 配信停止: メール内リンク → `GET /api/unsubscribe?e=&t=`（HMAC署名トークン検証 → subscribers削除）。
- ウィンドウ計算とHTML生成は `lib/newsletter.ts`。

## コスト目安

1記事 ≈ $0.11（Sonnet生成$0.032 + Haiku翻訳$0.013 + 画像: Pexels$0 or gpt-image medium$0.063）。
Pexelsヒット時は画像$0。平均7本/日で月 ≈ $23（画像をlowにすれば月$15程度）。

## 検証コマンド

- ビルド: `npm run build` / Lint: `npm run lint`（0 problems 維持）
- 収集手動テスト: dev起動後 `curl -X POST "http://localhost:3000/api/collect?source=1&limit=1"`
