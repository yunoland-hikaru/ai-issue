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
    mostPopular: 'MOST POPULAR',
    newsletter: '뉴스레터',
    newsletterDesc: 'AI 최신 정보를 이메일로 받아보세요',
    newsletterPlaceholder: 'your@email.com',
    newsletterButton: '구독하기',
    newsletterThanks: '구독해 주셔서 감사합니다!',
  },
  newsletterForm: {
    pageTitle: '뉴스레터 신청',
    breadcrumb: '뉴스레터 신청',
    consentHeading: '개인정보 수집·이용에 대한 동의사항',
    consentBody:
      '뉴스레터 발송을 위해 아래와 같이 개인정보를 수집·이용합니다. 1) 수집 항목: 이름·이메일(선택: 회사명·직책·연락처). 2) 이용 목적: 뉴스레터 발송 및 본인 확인. 3) 보유 기간: 수신 거부 시까지. 동의하지 않으셔도 서비스 이용은 가능하나 뉴스레터는 발송되지 않습니다.',
    name: '이름',
    company: '회사·기관명',
    jobTitle: '직책',
    phone: '연락처',
    email: '이메일',
    optional: '선택',
    agree: '개인정보 수집·이용에 동의합니다',
    submit: '신청하기',
    cancel: '취소',
    thanks: '뉴스레터 신청이 완료되었습니다.',
    alreadyRegistered: '이미 등록된 이메일입니다.',
    errorMsg: '오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
    agreeRequired: '개인정보 수집·이용에 동의해 주세요.',
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
