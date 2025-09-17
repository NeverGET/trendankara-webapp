'use client';

import React from 'react';
import { RadioPlayerProvider } from '@/components/radio/RadioPlayerContext';
import { Header } from '@/components/common/Header';
import { Footer } from '@/components/common/Footer';
import { EnhancedRadioPlayer } from '@/components/radio/EnhancedRadioPlayer';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <RadioPlayerProvider>
      <div className="flex flex-col min-h-screen pb-20">
        <Header />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
      </div>
      <EnhancedRadioPlayer />
    </RadioPlayerProvider>
  );
}