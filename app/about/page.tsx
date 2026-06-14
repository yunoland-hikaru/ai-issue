'use client';

import LegalPage from '@/components/LegalPage';
import LegalContent from '@/components/LegalContent';
import type { LegalBlock } from '@/lib/legalContent';
import { useLang } from '@/contexts/LangContext';
import type { Language } from '@/types';

const ABOUT: Record<Language, { title: string; blocks: LegalBlock[] }> = {
  ja: {
    title: 'AI issue について',
    blocks: [
      { t: 'p', text: 'AI issue は、日々生まれる大量のAI関連ニュースや新着AIツールの情報を自動で収集し、記者スタイルの読みやすい記事として届けるメディアです。「AIの世界を、毎日ひと目で。」をコンセプトに、忙しい毎日でも要点をすばやく把握できることを目指しています。' },
      { t: 'h2', text: '提供する情報' },
      { t: 'ul', items: ['AI業界の最新ニュース', '新しく登場したAIツール', '企業動向・規制や政策の話題', '関連する研究・技術トピック'] },
      { t: 'h2', text: '記事のつくり方' },
      { t: 'p', text: '複数の信頼できる情報源（RSS）から記事を収集し、AIが日本語・韓国語・英語で要約・再構成しています。出典は各記事に明示し、原文へのリンクもたどれます。重要な判断の際は、必ず元の情報源をご確認ください。' },
      { t: 'h2', text: 'ニュースレター' },
      { t: 'p', text: 'ご登録いただくと、その日のAIニュースをまとめたダイジェストをメールでお届けします。配信はいつでも停止できます。' },
      { t: 'h2', text: '運営・お問い合わせ' },
      { t: 'ul', items: ['サービス名：AI issue', 'メールアドレス：contact@ai-issue.com'] },
      { t: 'p', text: 'ご意見・ご要望はお問い合わせページからお送りください。' },
    ],
  },
  ko: {
    title: 'AI issue 소개',
    blocks: [
      { t: 'p', text: 'AI issue는 매일 쏟아지는 방대한 AI 관련 뉴스와 신규 AI 툴 정보를 자동으로 수집해, 기자 스타일의 읽기 쉬운 기사로 전달하는 미디어입니다. "AI 세상, 매일 한눈에."를 모토로, 바쁜 일상에서도 핵심을 빠르게 파악할 수 있도록 돕습니다.' },
      { t: 'h2', text: '제공하는 정보' },
      { t: 'ul', items: ['AI 업계 최신 뉴스', '새롭게 등장한 AI 툴', '기업 동향·규제 및 정책 이슈', '관련 연구·기술 토픽'] },
      { t: 'h2', text: '기사 제작 방식' },
      { t: 'p', text: '여러 신뢰할 수 있는 정보원(RSS)에서 기사를 수집하고, AI가 한국어·일본어·영어로 요약·재구성합니다. 출처는 각 기사에 명시하며 원문 링크도 제공합니다. 중요한 판단에는 반드시 원본 출처를 확인해 주세요.' },
      { t: 'h2', text: '뉴스레터' },
      { t: 'p', text: '구독하시면 그날의 AI 뉴스를 모은 다이제스트를 이메일로 보내드립니다. 수신은 언제든지 해지할 수 있습니다.' },
      { t: 'h2', text: '운영·문의' },
      { t: 'ul', items: ['서비스명: AI issue', '이메일: contact@ai-issue.com'] },
      { t: 'p', text: '의견·요청은 문의 페이지를 통해 보내주세요.' },
    ],
  },
  en: {
    title: 'About AI issue',
    blocks: [
      { t: 'p', text: 'AI issue automatically collects the flood of daily AI news and newly launched AI tools, and delivers them as clear, reporter-style articles. Guided by "The AI world, every day at a glance," we help you grasp the essentials quickly, even on a busy day.' },
      { t: 'h2', text: 'What We Cover' },
      { t: 'ul', items: ['The latest AI industry news', 'Newly launched AI tools', 'Company moves, regulation, and policy', 'Related research and technology topics'] },
      { t: 'h2', text: 'How Articles Are Made' },
      { t: 'p', text: 'We gather articles from multiple reputable sources (RSS), and AI summarizes and rewrites them in Japanese, Korean, and English. Sources are credited on each article with links to the originals. For important decisions, please refer to the original sources.' },
      { t: 'h2', text: 'Newsletter' },
      { t: 'p', text: 'Subscribe to receive a daily digest of AI news by email. You can unsubscribe at any time.' },
      { t: 'h2', text: 'Operator & Contact' },
      { t: 'ul', items: ['Service: AI issue', 'Email: contact@ai-issue.com'] },
      { t: 'p', text: 'Please send feedback or requests through our contact page.' },
    ],
  },
};

export default function AboutPage() {
  const { lang } = useLang();
  const doc = ABOUT[lang];
  return (
    <LegalPage title={doc.title}>
      <LegalContent blocks={doc.blocks} />
    </LegalPage>
  );
}
