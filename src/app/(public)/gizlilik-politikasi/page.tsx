import type { Metadata } from 'next';
import { PrivacyPolicyTRClient } from './PrivacyPolicyTRClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Gizlilik Politikası - Trend Ankara',
  description:
    'Trend Ankara mobil uygulaması ve web sitesi gizlilik politikası. KVKK kapsamında kişisel verilerinizin korunması ve kullanıcı haklarınız hakkında bilgi.',
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

export default function PrivacyPolicyTRPage() {
  return <PrivacyPolicyTRClient />;
}
