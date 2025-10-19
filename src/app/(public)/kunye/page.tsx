import type { Metadata } from 'next';
import { KunyeClient } from './KunyeClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Künye - Trend Ankara',
  description:
    'TrendAnkara radyo istasyonu künye bilgileri. Şirket bilgileri, yayın bilgileri ve iletişim detayları.',
  robots: {
    index: true,
    follow: true,
  },
};

export default function KunyePage() {
  return <KunyeClient />;
}
