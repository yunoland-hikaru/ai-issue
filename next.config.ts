import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Cloudflare Pages 向けに外部画像ドメインを許可
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: '**.aitimes.com' },
      { protocol: 'https', hostname: '**.techcrunch.com' },
      { protocol: 'https', hostname: '**.venturebeat.com' },
      { protocol: 'https', hostname: '**.theverge.com' },
    ],
  },
};

export default nextConfig;
