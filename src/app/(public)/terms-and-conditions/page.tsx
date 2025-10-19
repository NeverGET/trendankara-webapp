import type { Metadata } from 'next';
import { TermsConditionsENClient } from './TermsConditionsENClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Terms and Conditions - Trend Ankara',
  description:
    'Terms and Conditions for TrendAnkara mobile app and website. User agreement and service terms.',
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    languages: {
      en: '/terms-and-conditions',
      tr: '/kullanim-kosullari',
    },
  },
};

export default function TermsConditionsENPage() {
  return <TermsConditionsENClient />;
}
