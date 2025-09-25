'use client';

import { Button } from '@/components/ui/button';
import React, { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-dark-bg-primary flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-red-600">500</h1>
        <h2 className="text-2xl font-semibold text-dark-text-primary mt-4">
          {"Bir Hata Oluştu"}
        </h2>
        <p className="text-dark-text-secondary mt-2">
          {"Beklenmeyen bir hata oluştu. Lütfen daha sonra tekrar deneyin."}
        </p>
        <div className="mt-6 space-x-4">
          <Button onClick={() => reset()} variant="default">
            {"Tekrar Dene"}
          </Button>
          <Button onClick={() => window.location.href = '/'} variant="secondary">
            {"Ana Sayfaya Dön"}
          </Button>
        </div>
      </div>
    </div>
  );
}