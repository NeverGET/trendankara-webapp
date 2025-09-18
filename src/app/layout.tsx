import type { Metadata } from 'next';
// import { Inter } from 'next/font/google';  // Commented out to avoid timeout
import { AuthProvider } from '@/components/auth/AuthProvider';
import "./globals.css";

// const inter = Inter({ subsets: ['latin'] });  // Commented out to avoid timeout

export const metadata: Metadata = {
  title: 'Trend Ankara Radio',
  description: 'Türkiye\'nin en iyi radyo istasyonu - 24/7 kesintisiz müzik yayını',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side initialization will happen when API routes are accessed
  return (
    <html lang="tr" className="dark">
      <body suppressHydrationWarning className="bg-dark-bg-primary text-dark-text-primary min-h-screen">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}