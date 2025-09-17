'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface HeaderProps {
  currentPath?: string;
  user?: any;
}

const navigationItems = [
  { label: 'Ana Sayfa', path: '/' },
  { label: 'Haberler', path: '/news' },
  { label: 'Anketler', path: '/polls' }
];

export function Header({ user }: HeaderProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-dark-bg-primary/95 backdrop-blur-md border-b border-dark-border-primary">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-red-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">T</span>
            </div>
            <span className="text-xl font-bold text-dark-text-primary hidden sm:block">
              Trend Ankara
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navigationItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={cn(
                  'relative py-2 text-sm font-medium transition-colors',
                  pathname === item.path
                    ? 'text-dark-text-primary'
                    : 'text-dark-text-secondary hover:text-dark-text-primary'
                )}
              >
                {item.label}
                {pathname === item.path && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-red-600 animate-fade-in" />
                )}
              </Link>
            ))}
          </nav>

          {/* Desktop Radio Player Placeholder */}
          <div className="hidden lg:block">
            {/* RadioPlayer will be added here */}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-dark-text-secondary hover:text-dark-text-primary hover:bg-dark-surface-primary transition-all"
            aria-label="Menü"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {mobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 right-0 bg-dark-bg-primary border-b border-dark-border-primary animate-slide-down">
          <nav className="container mx-auto px-4 py-4">
            {navigationItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'block py-3 px-4 rounded-lg text-base font-medium transition-all',
                  pathname === item.path
                    ? 'bg-dark-surface-primary text-dark-text-primary'
                    : 'text-dark-text-secondary hover:text-dark-text-primary hover:bg-dark-surface-primary'
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}