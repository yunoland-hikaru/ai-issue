@AGENTS.md

# AI issue — プロジェクト概要

AI関連ニュース/新着ツールを自動収集し、記者スタイルの日本語記事に変換して提供するメディアプラットフォーム。要件定義書: `C:\work\ai-issue要件定義書.txt`（リポジトリ外）。

## 技術スタック（実装ベース）

- フロント: Next.js 16 (App Router, Turbopack) + Tailwind CSS v4 + TypeScript
- DB: Supabase (PostgreSQL) / 画像: Supabase Storage `article-images` バケット（Public）
- 記事生成: Anthropic Claude `claude-sonnet-4-6`
- 翻訳(ko/en): Anthropic Claude `claude-haiku-4-5-20251001`
- 画像生成: OpenAI `gpt-image-1`（DALL-E 3はこのアカウントで利用不可）
- RSS: rss-parser / 自動化: GitHub Actions（毎日 06:00 JST）
- フォント: `next/font/google`（Noto Sans JP/KR をセルフホスト）

## 記事生成フロー（`app/api/collect/route.ts`）

`POST /api/collect?source=0..3&limit=1..10`
1. `fetchRssFeed` でRSS取得（lib/rss.ts、各ソース最大10件）
2. `generateArticle`（lib/claude.ts）→ title_ja / content_ja / **summary_ja** / image_prompt / video_url / category
3. `translateArticle`（lib/claude.ts）→ title・summary・**content** の ko/en（翻訳失敗してもja記事は保存）
4. `generateImage`（lib/openai.ts、gpt-image-1）→ base64 → Supabase Storageへ永続保存 → image_url
5. articles テーブルへ insert（created_at = 生成時刻）

既存記事の後追い生成は `POST /api/migrate-content`（content_ja が null の記事を同パイプラインで補完）。

## 重要な実装判断・注意点（ハマりどころ）

- **画像モデルは gpt-image-1**。`dall-e-3` はこのアカウントに権限がなく `model does not exist` で失敗する。`response_format` パラメータは現行APIで非対応（指定すると400）。gpt-image-1 は **base64返却**（url無し）、サイズは 1536x1024（1792x1024 非対応、16:9に最も近い）。
- 画像生成失敗は `generateImage` が null を返すだけなので、collect 側で `results.errors` に必ず積んで可視化する（無言失敗を防ぐ）。
- 記事詳細の表示時刻は **created_at**（= Claude生成時刻）。published_at ではない（要件準拠）。
- カード/ヒーローの画像は **image_url 優先**（DALL-E/gpt-image生成画像）、無ければ thumbnail_url。
- 多言語: 収集時に ko/en を全フィールド埋める。UIは `lang` で出し分け、未訳は ja にフォールバック。
- `ThemeContext` は `useSyncExternalStore`（`<html>.dark` クラスが正本）。`set-state-in-effect` 回避のためで、effect内 setState に戻さないこと。
- RSS source=0 (AI Times) は韓国語。原文タイトルを title_en に入れない（翻訳結果を使う）。

## 環境変数（.env.local / Vercel）

`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`（GEMINI_API_KEY は廃止済み）。

## 検証コマンド

- ビルド: `npm run build` / Lint: `npm run lint`（0 problems を維持）
- 収集の手動テスト: dev起動後 `curl -X POST "http://localhost:3000/api/collect?source=1&limit=1"`
