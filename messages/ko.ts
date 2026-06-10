import type { Messages } from './ja';

const ko: Messages = {
  nav: {
    search: '검색',
    notifications: '알림',
    language: '언어 전환',
    user: '사용자',
  },
  tabs: {
    top: '홈',
    news: 'AI 뉴스',
    tools: '신규 툴',
    companies: '기업 동향',
    policy: '규제·정책',
    favorites: '즐겨찾기',
  },
  sections: {
    latestNews: '최신 뉴스',
    todayTools: '오늘의 신규 AI 툴',
    trending: '인기 키워드',
    newsletter: '뉴스레터',
    newsletterDesc: 'AI 최신 정보를 이메일로 받아보세요',
    newsletterPlaceholder: 'your@email.com',
    newsletterButton: '구독하기',
    newsletterThanks: '구독해 주셔서 감사합니다!',
  },
  pricing: {
    free: '무료',
    paid: '유료',
    freemium: '프리미엄',
  },
  article: {
    source: '출처',
    relatedNews: '관련 뉴스',
    backToTop: '홈으로',
    readOriginal: '원문 보기',
  },
  time: {
    minutesAgo: (n: number) => `${n}분 전`,
    hoursAgo: (n: number) => `${n}시간 전`,
    daysAgo: (n: number) => `${n}일 전`,
  },
};

export default ko;
