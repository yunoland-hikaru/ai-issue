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
      { t: 'p', text: 'AI issue は、AI技術で運営される「AIニュースメディア」です。記事はすべて「AI issue 編集部」の名義で発行しています。AIを活用して記事を作成するメディアであることを、透明に公開しています。' },
      { t: 'h2', text: '記事の作り方' },
      { t: 'p', text: 'AI issue 編集部が公開情報から「事実(ファクト)」を確認し、その事実だけをもとに、AIが日本語・韓国語・英語で完全に新しく書き起こします。元記事の文章や構成をそのまま写すことはせず、AI issue独自の文体で再構成した独立した著作物です。編集部が発行・管理しています。' },
      { t: 'h2', text: '著作権と透明性' },
      { t: 'p', text: '当メディアの記事は、AI issueが事実をもとに独自に作成した著作物であり、著作権はAI issueに帰属します。無断転載・再配布およびAIの学習・活用を禁じます。一方で、記事の作成にAIが関与するため、正確性・完全性・最新性を100%保証するものではありません。重要な判断の際は、一次情報を直接ご確認ください。' },
      { t: 'h2', text: '訂正・お問い合わせ' },
      { t: 'p', text: '誤りや訂正のご依頼があれば、お問い合わせページからご連絡ください。確認のうえ速やかに対応します。' },
      { t: 'ul', items: ['サービス名：AI issue', 'メールアドレス：contact@ai-issue.com'] },
    ],
  },
  ko: {
    title: '편집 방침 · 작성자 안내',
    blocks: [
      { t: 'p', text: 'AI issue는 AI 기술로 운영되는 "AI 뉴스 미디어"입니다. 모든 기사는 "AI issue 편집부" 명의로 발행됩니다. AI를 활용해 기사를 작성하는 미디어임을 투명하게 밝힙니다.' },
      { t: 'h2', text: '기사 제작 방식' },
      { t: 'p', text: 'AI issue 편집부가 공개된 정보에서 "사실(fact)"을 확인하고, 그 사실만을 바탕으로 AI가 한국어·일본어·영어로 완전히 새롭게 작성합니다. 원문의 문장이나 구성을 그대로 옮기지 않고, AI issue 고유의 문체로 재구성한 독립 저작물이며 편집부가 발행·관리합니다.' },
      { t: 'h2', text: '저작권과 투명성' },
      { t: 'p', text: '본 매체의 기사는 AI issue가 사실을 바탕으로 독자적으로 작성한 저작물이며, 저작권은 AI issue에 귀속됩니다. 무단 전재·재배포 및 AI 학습·활용을 금합니다. 다만 기사 작성에 AI가 관여하므로 정확성·완전성·최신성을 100% 보장하지는 않습니다. 중요한 판단에는 1차 정보를 직접 확인해 주세요.' },
      { t: 'h2', text: '정정 및 문의' },
      { t: 'p', text: '오류나 정정 요청이 있으면 문의 페이지를 통해 알려주세요. 확인 후 신속히 수정합니다.' },
      { t: 'ul', items: ['서비스명: AI issue', '이메일: contact@ai-issue.com'] },
    ],
  },
  en: {
    title: 'Editorial Policy & Authorship',
    blocks: [
      { t: 'p', text: 'AI issue is an AI news media powered by AI technology. All articles are published under the name "AI issue Staff." We transparently disclose that this is a media outlet that produces articles with the help of AI.' },
      { t: 'h2', text: 'How Articles Are Made' },
      { t: 'p', text: 'The AI issue editorial team verifies facts from public information, and based on those facts alone, AI writes entirely new articles in Japanese, Korean, and English. We do not copy the wording or structure of any source; each piece is an independent work rewritten in AI issue’s own voice, published and maintained by the editorial team.' },
      { t: 'h2', text: 'Copyright & Transparency' },
      { t: 'p', text: 'Articles on this site are original works independently created by AI issue based on factual reporting, and the copyright belongs to AI issue. Unauthorized reproduction, redistribution, or use for AI training is prohibited. At the same time, because AI is involved in producing the articles, we do not guarantee 100% accuracy, completeness, or timeliness. For important decisions, please verify with primary sources directly.' },
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
