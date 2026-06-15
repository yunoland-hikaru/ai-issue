'use client';

import LegalPage from '@/components/LegalPage';
import LegalContent from '@/components/LegalContent';
import { TERMS } from '@/lib/legalContent';
import { useLang } from '@/contexts/LangContext';

export default function TermsPage() {
  const { lang } = useLang();
  const doc = TERMS[lang];
  return (
    <LegalPage title={doc.title} effectiveDate={doc.effectiveDate}>
      <LegalContent blocks={doc.blocks} />
    </LegalPage>
  );
}
