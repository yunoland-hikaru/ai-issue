import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // 外部画像ドメインを許可（DALL-E画像はSupabase Storageに永続保存）
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: '**.aitimes.com' },
      { protocol: 'https', hostname: '**.techcrunch.com' },
      { protocol: 'https', hostname: '**.venturebeat.com' },
      { protocol: 'https', hostname: '**.theverge.com' },
    ],
  },
};

export default nextConfig;
