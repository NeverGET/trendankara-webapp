'use client';

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
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0a0a0a',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      textAlign: 'center',
      color: '#ffffff'
    }}>
      <div>
        <h1 style={{
          fontSize: '6rem',
          fontWeight: 'bold',
          color: '#dc2626',
          margin: '0',
          lineHeight: '1'
        }}>
          500
        </h1>
        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: '600',
          marginTop: '1rem',
          marginBottom: '0.5rem'
        }}>
          Bir Hata Oluştu
        </h2>
        <p style={{
          color: '#9ca3af',
          marginTop: '0.5rem',
          marginBottom: '1.5rem'
        }}>
          Beklenmeyen bir hata oluştu. Lütfen daha sonra tekrar deneyin.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button
            onClick={() => reset()}
            style={{
              padding: '0.625rem 1.25rem',
              backgroundColor: '#3b82f6',
              color: '#ffffff',
              border: 'none',
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#2563eb';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#3b82f6';
            }}
          >
            Tekrar Dene
          </button>
          <button
            onClick={() => window.location.href = '/'}
            style={{
              padding: '0.625rem 1.25rem',
              backgroundColor: '#6b7280',
              color: '#ffffff',
              border: 'none',
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#4b5563';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#6b7280';
            }}
          >
            Ana Sayfaya Dön
          </button>
        </div>
      </div>
    </div>
  );
}