export interface Messages {
  nav: {
    search: string;
    notifications: string;
    language: string;
    user: string;
  };
  tabs: {
    top: string;
    news: string;
    tools: string;
    companies: string;
    policy: string;
    favorites: string;
  };
  sections: {
    latestNews: string;
    todayTools: string;
    trending: string;
    newsletter: string;
    newsletterDesc: string;
    newsletterPlaceholder: string;
    newsletterButton: string;
    newsletterThanks: string;
  };
  pricing: {
    free: string;
    paid: string;
    freemium: string;
  };
  article: {
    source: string;
    relatedNews: string;
    backToTop: string;
    readOriginal: string;
  };
  time: {
    minutesAgo: (n: number) => string;
    hoursAgo: (n: number) => string;
    daysAgo: (n: number) => string;
  };
}

const ja: Messages = {
  nav: {
    search: '検索',
    notifications: '通知',
    language: '言語切替',
    user: 'ユーザー',
  },
  tabs: {
    top: 'トップ',
    news: 'AIニュース',
    tools: '新着ツール',
    companies: '企業動向',
    policy: '規制・政策',
    favorites: 'お気に入り',
  },
  sections: {
    latestNews: '最新ニュース',
    todayTools: '今日の新着AIツール',
    trending: '話題のキーワード',
    newsletter: 'ニュースレター',
    newsletterDesc: 'AIの最新情報をメールで受け取る',
    newsletterPlaceholder: 'your@email.com',
    newsletterButton: '登録する',
    newsletterThanks: '登録ありがとうございます！',
  },
  pricing: {
    free: '無料',
    paid: '有料',
    freemium: 'フリー',
  },
  article: {
    source: 'ソース',
    relatedNews: '関連ニュース',
    backToTop: 'トップに戻る',
    readOriginal: '原文を読む',
  },
  time: {
    minutesAgo: (n: number) => `${n}分前`,
    hoursAgo: (n: number) => `${n}時間前`,
    daysAgo: (n: number) => `${n}日前`,
  },
};

export default ja;
