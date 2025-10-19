import type { Metadata } from 'next';
import { TermsConditionsTRClient } from './TermsConditionsTRClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Kullanım Koşulları - Trend Ankara',
  description:
    'Trend Ankara mobil uygulaması ve web sitesi kullanım koşulları. Hizmetimizi kullanmadan önce lütfen bu koşulları okuyun.',
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    languages: {
      tr: '/kullanim-kosullari',
      en: '/terms-and-conditions',
    },
  },
};

export default function TermsConditionsTRPage() {
  return <TermsConditionsTRClient />;
}
