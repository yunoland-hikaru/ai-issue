export interface Messages {
  nav: {
    search: string;
    notifications: string;
    language: string;
    user: string;
  };
  tabs: {
    top: string;
    industry: string;
    tech: string;
    policy: string;
  };
  search: {
    placeholder: string;
    noResults: string;
    hint: string;
  };
  sections: {
    latestNews: string;
    todayTools: string;
    trending: string;
    mostPopular: string;
    newsletter: string;
    newsletterDesc: string;
    newsletterPlaceholder: string;
    newsletterButton: string;
    newsletterThanks: string;
  };
  newsletterForm: {
    pageTitle: string;
    breadcrumb: string;
    consentHeading: string;
    consentBody: string;
    name: string;
    company: string;
    jobTitle: string;
    phone: string;
    email: string;
    optional: string;
    agree: string;
    submit: string;
    cancel: string;
    thanks: string;
    alreadyRegistered: string;
    errorMsg: string;
    agreeRequired: string;
  };
  contactForm: {
    pageTitle: string;
    intro: string;
    name: string;
    email: string;
    message: string;
    submit: string;
    thanks: string;
    errorMsg: string;
  };
  footer: {
    tagline: string;
    description: string;
    navHeading: string;
    infoHeading: string;
    home: string;
    about: string;
    newsletter: string;
    contact: string;
    privacy: string;
    terms: string;
    rights: string;
    toTop: string;
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
    top: '全て',
    industry: 'AI産業',
    tech: 'AI技術',
    policy: '規制・政策',
  },
  search: {
    placeholder: '記事を検索...',
    noResults: '記事が見つかりませんでした',
    hint: 'キーワードを入力してください',
  },
  sections: {
    latestNews: '最新ニュース',
    todayTools: '今日の新着AIツール',
    trending: '話題のキーワード',
    mostPopular: '人気記事',
    newsletter: 'ニュースレター',
    newsletterDesc: 'AIの最新情報をメールで受け取る',
    newsletterPlaceholder: 'your@email.com',
    newsletterButton: '登録する',
    newsletterThanks: '登録ありがとうございます！',
  },
  newsletterForm: {
    pageTitle: 'ニュースレター申込',
    breadcrumb: 'ニュースレター申込',
    consentHeading: '個人情報の取り扱いについての同意事項',
    consentBody:
      'ニュースレター配信のため、以下のとおり個人情報を収集・利用します。1) 収集項目: お名前・メールアドレス（任意で会社名・役職・連絡先）。2) 利用目的: ニュースレターの配信および本人確認。3) 保有期間: 配信停止のお申し出があるまで。同意されない場合もサービスのご利用は可能ですが、ニュースレターは配信されません。',
    name: 'お名前',
    company: '会社・団体名',
    jobTitle: '役職',
    phone: '電話番号',
    email: 'メールアドレス',
    optional: '任意',
    agree: '個人情報の収集・利用に同意します',
    submit: '申し込む',
    cancel: 'キャンセル',
    thanks: 'ニュースレターの申し込みが完了しました。',
    alreadyRegistered: 'このメールアドレスは既に登録されています。',
    errorMsg: 'エラーが発生しました。時間をおいて再度お試しください。',
    agreeRequired: '個人情報の取り扱いに同意してください。',
  },
  contactForm: {
    pageTitle: 'お問い合わせ',
    intro: 'ご質問・ご要望はこちらからお送りください。いただいた内容には順次ご返信いたします。',
    name: 'お名前',
    email: 'メールアドレス',
    message: 'お問い合わせ内容',
    submit: '送信する',
    thanks: 'お問い合わせを送信しました。ありがとうございます。',
    errorMsg: 'エラーが発生しました。時間をおいて再度お試しください。',
  },
  footer: {
    tagline: 'AIの世界を、毎日ひと目で。',
    description: '日本語・韓国語・英語で、ひと目でチェック。',
    navHeading: 'ナビゲーション',
    infoHeading: 'インフォメーション',
    home: 'ホーム',
    about: 'サービス紹介',
    newsletter: 'ニュースレター申込',
    contact: 'お問い合わせ',
    privacy: 'プライバシーポリシー',
    terms: '利用規約',
    rights: 'All rights reserved.',
    toTop: 'トップへ戻る',
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
