import type { Article, Tool, TrendingKeyword } from '@/types';

export const dummyArticles: Article[] = [
  {
    id: '1',
    title_ja: 'OpenAI、GPT-5を正式発表 — 推論能力が大幅向上し複雑な数学問題も解決',
    title_en: 'OpenAI announces GPT-5 with dramatically improved reasoning',
    summary_ja:
      'OpenAIはGPT-5を正式発表しました。前モデルと比較して推論能力が大幅に向上し、複雑な数学や科学的問題をより正確に解けるようになりました。また、マルチモーダル対応も強化され、画像・音声・テキストをより自然に組み合わせた処理が可能です。',
    category: 'AI産業',
    source_url: 'https://openai.com',
    source_name: 'OpenAI',
    thumbnail_url: 'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=640&q=80',
    published_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    created_at: new Date().toISOString(),
  },
  {
    id: '2',
    title_ja: 'Anthropic、Claude 4の安全性レポートを公開 — AIリスク評価の新基準を提示',
    summary_ja:
      'Anthropicは最新モデルClaude 4の詳細な安全性評価レポートを公開しました。バイオ兵器や核兵器に関する情報提供リスク、自律的な行動能力などを段階的に評価する新フレームワークを採用しています。',
    category: 'AI産業',
    source_url: 'https://anthropic.com',
    source_name: 'Anthropic',
    thumbnail_url: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=640&q=80',
    published_at: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    created_at: new Date().toISOString(),
  },
  {
    id: '3',
    title_ja: 'EU AI法が本格施行 — 高リスクAIシステムへの規制が欧州企業に影響',
    summary_ja:
      'EU AI規制法が全面施行に入り、医療・交通・金融分野などの高リスクAIシステムに対して厳格な透明性要件と人間による監視義務が課されます。違反企業には最大3,000万ユーロの罰金が科される可能性があります。',
    category: '規制・政策',
    source_url: 'https://techcrunch.com',
    source_name: 'TechCrunch',
    thumbnail_url: 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=640&q=80',
    published_at: new Date(Date.now() - 1000 * 60 * 150).toISOString(),
    created_at: new Date().toISOString(),
  },
  {
    id: '4',
    title_ja: 'Google DeepMind、タンパク質構造予測AI「AlphaFold 3」を医療向けに商用化',
    summary_ja:
      'Google DeepMindはAlphaFold 3の商用APIを製薬企業向けに提供開始しました。新薬開発の初期段階で候補分子とタンパク質の相互作用予測が可能になり、創薬期間を大幅に短縮できると期待されています。',
    category: 'AI技術',
    source_url: 'https://venturebeat.com',
    source_name: 'VentureBeat',
    thumbnail_url: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=640&q=80',
    published_at: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
    created_at: new Date().toISOString(),
  },
  {
    id: '5',
    title_ja: 'NVIDIAのBlackwell GPUが品薄 — AI需要急増でデータセンター向け供給に遅れ',
    summary_ja:
      'NVIDIAの最新GPU「Blackwell」アーキテクチャの需要が供給を大幅に上回っており、主要クラウドプロバイダーへの納期が数カ月遅延しています。AI学習需要の急増が半導体供給チェーン全体に圧力をかけています。',
    category: 'AI産業',
    source_url: 'https://theverge.com',
    source_name: 'The Verge',
    thumbnail_url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=640&q=80',
    published_at: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
    created_at: new Date().toISOString(),
  },
  {
    id: '6',
    title_ja: 'Cursor、AIコードエディタ市場でGitHub Copilotを抜き首位に — 月間ユーザー100万人超',
    summary_ja:
      'AIコードエディタ「Cursor」が月間アクティブユーザー100万人を突破し、GitHub Copilotを抜いてシェア首位に立ったと報じられています。エージェント型コーディング機能の使いやすさが開発者に支持されています。',
    category: 'AI技術',
    source_url: 'https://techcrunch.com',
    source_name: 'TechCrunch',
    published_at: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
    created_at: new Date().toISOString(),
  },
];

export const dummyTools: Tool[] = [
  {
    id: '1',
    name: 'Perplexity Pro',
    description_ja: 'AIが最新情報をリアルタイム検索しながら回答するリサーチアシスタント',
    category: '検索・リサーチ',
    pricing_type: 'freemium',
    url: 'https://perplexity.ai',
    upvotes: 342,
    created_at: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Runway Gen-4',
    description_ja: 'テキストや画像から高品質な動画を生成するAI動画クリエイター',
    category: '動画生成',
    pricing_type: 'paid',
    url: 'https://runwayml.com',
    upvotes: 218,
    created_at: new Date().toISOString(),
  },
  {
    id: '3',
    name: 'NotebookLM',
    description_ja: 'Googleのドキュメント要約・Q&AツールがPodcastモードに対応',
    category: '学習・生産性',
    pricing_type: 'free',
    url: 'https://notebooklm.google',
    upvotes: 195,
    created_at: new Date().toISOString(),
  },
];

export const dummyKeywords: TrendingKeyword[] = [
  { id: '1', keyword: 'GPT-5', count: 1240, date: new Date().toISOString() },
  { id: '2', keyword: 'Claude 4', count: 980, date: new Date().toISOString() },
  { id: '3', keyword: 'EU AI法', count: 720, date: new Date().toISOString() },
  { id: '4', keyword: 'AlphaFold', count: 510, date: new Date().toISOString() },
  { id: '5', keyword: 'Blackwell', count: 430, date: new Date().toISOString() },
];
