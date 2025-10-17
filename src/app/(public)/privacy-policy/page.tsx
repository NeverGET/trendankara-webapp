import type { Metadata } from 'next';
import { PrivacyPolicyENClient } from './PrivacyPolicyENClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Privacy Policy - Trend Ankara',
  description:
    'Trend Ankara mobile app and website privacy policy. Information about the protection of your personal data and your data subject rights under KVKK.',
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    languages: {
      tr: '/gizlilik-politikasi',
      en: '/privacy-policy',
    },
  },
};

export default function PrivacyPolicyENPage() {
  return <PrivacyPolicyENClient />;
}
