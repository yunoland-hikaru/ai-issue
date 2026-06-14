import type { Messages } from './ja';

const en: Messages = {
  nav: {
    search: 'Search',
    notifications: 'Notifications',
    language: 'Language',
    user: 'User',
  },
  tabs: {
    top: 'Top',
    news: 'AI News',
    tools: 'New Tools',
    companies: 'Companies',
    policy: 'Policy',
    favorites: 'Favorites',
  },
  sections: {
    latestNews: 'Latest News',
    todayTools: "Today's AI Tools",
    trending: 'Trending Keywords',
    mostPopular: 'MOST POPULAR',
    newsletter: 'Newsletter',
    newsletterDesc: 'Get the latest AI news in your inbox',
    newsletterPlaceholder: 'your@email.com',
    newsletterButton: 'Subscribe',
    newsletterThanks: 'Thanks for subscribing!',
  },
  pricing: {
    free: 'Free',
    paid: 'Paid',
    freemium: 'Freemium',
  },
  article: {
    source: 'Source',
    relatedNews: 'Related News',
    backToTop: 'Back to Top',
    readOriginal: 'Read Original',
  },
  time: {
    minutesAgo: (n: number) => `${n}m ago`,
    hoursAgo: (n: number) => `${n}h ago`,
    daysAgo: (n: number) => `${n}d ago`,
  },
};

export default en;
