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
      { t: 'p', text: 'AI issue は、日々生まれる大量のAI関連ニュースや新着AIツールの情報を、確かな事実をもとに記者スタイルの読みやすい独自記事として書き起こして届けるメディアです。「AIの世界を、毎日ひと目で。」をコンセプトに、忙しい毎日でも要点をすばやく把握できることを目指しています。' },
      { t: 'h2', text: '提供する情報' },
      { t: 'p', text: '記事は大きく3つのカテゴリに分けて提供しています。' },
      { t: 'ul', items: ['AI産業 — 企業・製品・投資・市場などのビジネス/業界動向', 'AI技術 — モデル・研究成果・新しいAIツール・技術的ブレイクスルー', '規制・政策 — 政府・法規制・倫理・安全性に関する話題'] },
      { t: 'h2', text: '記事のつくり方' },
      { t: 'p', text: 'AI issue 編集部が選んだ公開情報から「事実(ファクト)」だけを抽出し、それをもとにAIが日本語・韓国語・英語の記事を新しく書き起こします。元記事の文章や構成をそのまま写すのではなく、専門用語をかみ砕き、わかりやすく読みやすい文章に整えた、AI issue独自の著作物です。記事の著作権はAI issueに帰属します。なお記事はAIが作成するため、正確性・完全性・最新性を100%保証するものではありません。重要な判断の際は一次情報をご確認ください（詳しくは「編集方針」をご覧ください）。' },
      { t: 'h2', text: 'ニュースレター' },
      { t: 'p', text: 'ご登録いただくと、その日のAIニュースをまとめたダイジェストをメールでお届けします。配信はいつでも停止できます。' },
      { t: 'h2', text: 'コメント・会員登録' },
      { t: 'p', text: '会員登録（任意・無料）を行うと、記事にコメントを投稿して他の読者と意見を交わせます。登録しなくても、記事の閲覧やニュースレターの購読はご利用いただけます。' },
      { t: 'h2', text: '運営・お問い合わせ' },
      { t: 'ul', items: ['サービス名：AI issue', 'メールアドレス：contact@ai-issue.com'] },
      { t: 'p', text: 'ご意見・ご要望はお問い合わせページからお送りください。' },
    ],
  },
  ko: {
    title: 'AI issue 소개',
    blocks: [
      { t: 'p', text: 'AI issue는 매일 쏟아지는 방대한 AI 관련 뉴스와 신규 AI 툴 정보를, 확인된 사실을 바탕으로 기자 스타일의 읽기 쉬운 독자 기사로 새롭게 작성해 전달하는 미디어입니다. "AI 세상, 매일 한 눈에."를 모토로, 바쁜 일상에서도 핵심을 빠르게 파악할 수 있도록 돕습니다.' },
      { t: 'h2', text: '제공하는 정보' },
      { t: 'p', text: '기사는 크게 3가지 카테고리로 나누어 제공합니다.' },
      { t: 'ul', items: ['AI 산업 — 기업·제품·투자·시장 등 비즈니스/업계 동향', 'AI 기술 — 모델·연구 성과·신규 AI 툴·기술적 돌파구', '규제·정책 — 정부·법규제·윤리·안전성 관련 이슈'] },
      { t: 'h2', text: '기사 제작 방식' },
      { t: 'p', text: 'AI issue 편집부가 선별한 공개 정보에서 "사실(fact)"만을 추출하고, 이를 바탕으로 AI가 한국어·일본어·영어 기사를 새롭게 작성합니다. 원문의 문장이나 구성을 그대로 옮기지 않고 전문용어를 풀어 쉽고 읽기 편한 문장으로 재구성한, AI issue 고유의 저작물입니다. 기사의 저작권은 AI issue에 귀속됩니다. 다만 기사는 AI가 작성하므로 정확성·완전성·최신성을 100% 보장하지는 않습니다. 중요한 판단에는 1차 정보를 확인해 주세요(자세한 내용은 "편집 방침" 참조).' },
      { t: 'h2', text: '뉴스레터' },
      { t: 'p', text: '구독하시면 그날의 AI 뉴스를 모은 다이제스트를 이메일로 보내드립니다. 수신은 언제든지 해지할 수 있습니다.' },
      { t: 'h2', text: '댓글·회원가입' },
      { t: 'p', text: '회원가입(선택·무료)을 하면 기사에 댓글을 남기고 다른 독자와 의견을 나눌 수 있습니다. 가입하지 않아도 기사 열람과 뉴스레터 구독은 이용할 수 있습니다.' },
      { t: 'h2', text: '운영·문의' },
      { t: 'ul', items: ['서비스명: AI issue', '이메일: contact@ai-issue.com'] },
      { t: 'p', text: '의견·요청은 문의 페이지를 통해 보내주세요.' },
    ],
  },
  en: {
    title: 'About AI issue',
    blocks: [
      { t: 'p', text: 'AI issue turns the flood of daily AI news and newly launched AI tools into clear, reporter-style original articles written from verified facts. Guided by "The AI world, every day at a glance," we help you grasp the essentials quickly, even on a busy day.' },
      { t: 'h2', text: 'What We Cover' },
      { t: 'p', text: 'Articles are organized into three broad categories.' },
      { t: 'ul', items: ['AI Industry — companies, products, investment, and market trends', 'AI Technology — models, research, new AI tools, and breakthroughs', 'Policy & Regulation — government, law, ethics, and safety'] },
      { t: 'h2', text: 'How Articles Are Made' },
      { t: 'p', text: 'The AI issue editorial team extracts only the facts from selected public sources, and AI uses those facts to write fresh articles in Japanese, Korean, and English. Rather than copying the original wording or structure, we gloss technical terms and rewrite everything into clear, easy-to-read prose — an original work in AI issue’s own voice. Copyright belongs to AI issue. Because articles are produced by AI, we do not guarantee 100% accuracy, completeness, or timeliness; for important decisions, please verify with primary sources (see our Editorial Policy for details).' },
      { t: 'h2', text: 'Newsletter' },
      { t: 'p', text: 'Subscribe to receive a daily digest of AI news by email. You can unsubscribe at any time.' },
      { t: 'h2', text: 'Comments & Accounts' },
      { t: 'p', text: 'Create a free account (optional) to comment on articles and join the conversation with other readers. You can still browse articles and subscribe to the newsletter without an account.' },
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
