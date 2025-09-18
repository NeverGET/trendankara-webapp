'use client';

/**
 * Login page component
 * SIMPLE implementation with email/password form
 */

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import Image from 'next/image';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/admin';

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        email: username, // We still send it as 'email' to match the provider
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Kullanıcı adı veya şifre hatalı'); // Turkish: Invalid username or password
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (err) {
      setError('Bir hata oluştu. Lütfen tekrar deneyin.'); // Turkish: An error occurred. Please try again.
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-bg-primary p-4">
      <Card className="w-full max-w-md p-8 bg-dark-surface-primary border-dark-border-primary">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="mb-4 flex justify-center">
            <div className="w-32 h-32 bg-brand-red-600 rounded-full flex items-center justify-center">
              <span className="text-white text-2xl font-bold">TREND</span>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-dark-text-primary">
            Trend Ankara Radyo
          </h1>
          <p className="text-dark-text-secondary mt-2">
            Yönetim Paneli Girişi
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Kullanıcı Adı"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="admin"
            required
            disabled={isLoading}
            autoComplete="username"
          />

          <Input
            label="Şifre"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            disabled={isLoading}
            autoComplete="current-password"
          />

          {error && (
            <div className="p-3 rounded-lg bg-red-900/20 border border-red-600/30">
              <p className="text-sm text-red-500">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
            variant="primary"
            size="lg"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Giriş yapılıyor...
              </span>
            ) : (
              'Giriş Yap'
            )}
          </Button>
        </form>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-dark-text-tertiary">
            © 2024 Trend Ankara Radyo. Tüm hakları saklıdır.
          </p>
        </div>
      </Card>
    </div>
  );
}