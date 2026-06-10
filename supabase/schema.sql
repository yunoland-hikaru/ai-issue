-- AI issue データベーススキーマ
-- Supabase SQL Editor に貼り付けて実行してください

-- ニュース記事
create table if not exists articles (
  id uuid primary key default gen_random_uuid(),
  title_ja text not null,
  title_en text,
  title_ko text,
  summary_ja text,
  summary_en text,
  summary_ko text,
  category text,
  source_url text unique,
  source_name text,
  thumbnail_url text,
  published_at timestamptz,
  created_at timestamptz default now()
);

create index if not exists articles_published_at_idx on articles(published_at desc);
create index if not exists articles_category_idx on articles(category);

-- AIツール
create table if not exists tools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description_ja text,
  description_en text,
  category text,
  pricing_type text check (pricing_type in ('free','paid','freemium')),
  url text,
  upvotes int default 0,
  created_at timestamptz default now()
);

-- ニュースレター購読者
create table if not exists subscribers (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  created_at timestamptz default now()
);

-- トレンドキーワード
create table if not exists trending_keywords (
  id uuid primary key default gen_random_uuid(),
  keyword text not null,
  count int default 1,
  date date default current_date
);

create index if not exists trending_keywords_date_idx on trending_keywords(date desc);

-- Row Level Security
alter table articles enable row level security;
alter table tools enable row level security;
alter table subscribers enable row level security;
alter table trending_keywords enable row level security;

-- 読み取りは全員OK（匿名含む）
create policy "articles_read" on articles for select using (true);
create policy "tools_read" on tools for select using (true);
create policy "trending_read" on trending_keywords for select using (true);

-- 書き込みはサービスロールキーのみ（APIルートから）
create policy "articles_insert" on articles for insert with check (false);
create policy "tools_update" on tools for update using (false);
create policy "subscribers_insert" on subscribers for insert with check (false);
create policy "trending_insert" on trending_keywords for insert with check (false);
create policy "trending_delete" on trending_keywords for delete using (false);

-- サンプルデータ（任意）
insert into tools (name, description_ja, description_en, category, pricing_type, url, upvotes) values
  ('Perplexity Pro', 'AIが最新情報をリアルタイム検索しながら回答するリサーチアシスタント', 'AI-powered research assistant with real-time search', '検索・リサーチ', 'freemium', 'https://perplexity.ai', 342),
  ('Runway Gen-4', 'テキストや画像から高品質な動画を生成するAI動画クリエイター', 'AI video generator from text and images', '動画生成', 'paid', 'https://runwayml.com', 218),
  ('NotebookLM', 'Googleのドキュメント要約・Q&AツールがPodcastモードに対応', 'Google document summarizer with Podcast mode', '学習・生産性', 'free', 'https://notebooklm.google', 195)
on conflict do nothing;
