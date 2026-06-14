'use client';

import LegalPage from '@/components/LegalPage';
import LegalContent from '@/components/LegalContent';
import { PRIVACY } from '@/lib/legalContent';
import { useLang } from '@/contexts/LangContext';

export default function PrivacyPage() {
  const { lang } = useLang();
  const doc = PRIVACY[lang];
  return (
    <LegalPage title={doc.title} effectiveDate={doc.effectiveDate}>
      <LegalContent blocks={doc.blocks} />
    </LegalPage>
  );
}
