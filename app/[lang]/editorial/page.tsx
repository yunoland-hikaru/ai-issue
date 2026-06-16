'use client';

import LegalPage from '@/components/LegalPage';
import LegalContent from '@/components/LegalContent';
import type { LegalBlock } from '@/lib/legalContent';
import { useLang } from '@/contexts/LangContext';
import type { Language } from '@/types';

const EDITORIAL: Record<Language, { title: string; blocks: LegalBlock[] }> = {
  ja: {
    title: '編集方針・著者について',
    blocks: [
      { t: 'p', text: 'AI issue は、AI技術で運営される「AIキュレーション・ニュースメディア」です。記事はすべて「AI issue 編集部」の名義で発行しています。AIを活用して記事を作成するメディアであることを、透明に公開しています。' },
      { t: 'h2', text: '記事の作り方' },
      { t: 'p', text: 'AI issue 編集部が信頼できる公開情報源（RSSなど）を選定し、その情報をもとにAIが日本語・韓国語・英語で要約・再構成して記事を作成します。単なる翻訳ではなく、背景や文脈、意味合いを補った解説スタイルで、編集部が発行・管理しています。' },
      { t: 'h2', text: '出典と透明性' },
      { t: 'p', text: '各記事には元の情報源を明記し、原文へのリンクを提供します。記事はAIが作成したものであり、正確性・完全性・最新性を100%保証するものではありません。重要な判断の際は、必ず元の情報源をご確認ください。' },
      { t: 'h2', text: '訂正・お問い合わせ' },
      { t: 'p', text: '誤りや訂正のご依頼があれば、お問い合わせページからご連絡ください。確認のうえ速やかに対応します。' },
      { t: 'ul', items: ['サービス名：AI issue', 'メールアドレス：contact@ai-issue.com'] },
    ],
  },
  ko: {
    title: '편집 방침 · 작성자 안내',
    blocks: [
      { t: 'p', text: 'AI issue는 AI 기술로 운영되는 "AI 큐레이션 뉴스 미디어"입니다. 모든 기사는 "AI issue 편집부" 명의로 발행됩니다. AI를 활용해 기사를 작성하는 미디어임을 투명하게 밝힙니다.' },
      { t: 'h2', text: '기사 제작 방식' },
      { t: 'p', text: 'AI issue 편집부가 신뢰할 수 있는 공개 정보원(RSS 등)을 선별하고, 그 출처를 바탕으로 AI가 한국어·일본어·영어로 요약·재구성해 기사를 작성합니다. 단순 번역이 아니라 배경과 맥락, 의미를 더한 해설 형태이며, 편집부가 발행·관리합니다.' },
      { t: 'h2', text: '출처와 투명성' },
      { t: 'p', text: '각 기사에는 원문 출처를 명시하고 원문 링크를 제공합니다. 기사는 AI가 작성한 것으로 정확성·완전성·최신성을 100% 보장하지 않습니다. 중요한 판단에는 반드시 원문 출처를 확인해 주세요.' },
      { t: 'h2', text: '정정 및 문의' },
      { t: 'p', text: '오류나 정정 요청이 있으면 문의 페이지를 통해 알려주세요. 확인 후 신속히 수정합니다.' },
      { t: 'ul', items: ['서비스명: AI issue', '이메일: contact@ai-issue.com'] },
    ],
  },
  en: {
    title: 'Editorial Policy & Authorship',
    blocks: [
      { t: 'p', text: 'AI issue is an AI-curation news media powered by AI technology. All articles are published under the name "AI issue Staff." We transparently disclose that this is a media outlet that produces articles with the help of AI.' },
      { t: 'h2', text: 'How Articles Are Made' },
      { t: 'p', text: 'The AI issue editorial team curates reputable public sources (such as RSS), and AI summarizes and restructures them in Japanese, Korean, and English to produce each article. Rather than a simple translation, articles are written in an explanatory style that adds background, context, and significance, and the editorial team publishes and maintains them.' },
      { t: 'h2', text: 'Sources & Transparency' },
      { t: 'p', text: 'Each article credits the original source and links to the original. Articles are produced by AI and we do not guarantee 100% accuracy, completeness, or timeliness. For important decisions, please refer to the original source.' },
      { t: 'h2', text: 'Corrections & Contact' },
      { t: 'p', text: 'If you find an error or would like to request a correction, please reach us through the contact page. We will review and address it promptly.' },
      { t: 'ul', items: ['Service: AI issue', 'Email: contact@ai-issue.com'] },
    ],
  },
};

export default function EditorialPage() {
  const { lang } = useLang();
  const doc = EDITORIAL[lang];
  return (
    <LegalPage title={doc.title}>
      <LegalContent blocks={doc.blocks} />
    </LegalPage>
  );
}
