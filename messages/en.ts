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
  newsletterForm: {
    pageTitle: 'Newsletter Signup',
    breadcrumb: 'Newsletter Signup',
    consentHeading: 'Consent to Collection and Use of Personal Information',
    consentBody:
      'We collect and use your personal information to deliver the newsletter, as follows. 1) Items: name and email (optionally company, job title, phone). 2) Purpose: newsletter delivery and identity verification. 3) Retention: until you unsubscribe. You may use the service without consenting, but the newsletter will not be delivered.',
    name: 'Name',
    company: 'Company / Organization',
    jobTitle: 'Job Title',
    phone: 'Phone',
    email: 'Email',
    optional: 'optional',
    agree: 'I agree to the collection and use of my personal information',
    submit: 'Subscribe',
    cancel: 'Cancel',
    thanks: 'Your newsletter signup is complete.',
    alreadyRegistered: 'This email is already registered.',
    errorMsg: 'An error occurred. Please try again later.',
    agreeRequired: 'Please agree to the handling of personal information.',
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
