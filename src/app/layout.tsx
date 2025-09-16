import type { Metadata } from 'next';
import "./globals.css";

export const metadata: Metadata = {
  title: 'Radio Station CMS',
  description: 'Professional Radio Station Content Management System',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side initialization will happen when API routes are accessed
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}