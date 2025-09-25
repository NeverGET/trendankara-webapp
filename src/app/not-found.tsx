import { Button } from '@/components/ui/button';
import Link from 'next/link';
import React from 'react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-dark-bg-primary flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-red-600">404</h1>
        <h2 className="text-2xl font-semibold text-dark-text-primary mt-4">
          {"Sayfa Bulunamadı"}
        </h2>
        <p className="text-dark-text-secondary mt-2">
          {"Aradığınız sayfa mevcut değil veya taşınmış olabilir."}
        </p>
        <div className="mt-6">
          <Link href="/">
            <Button variant="default">
              {"Ana Sayfaya Dön"}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}