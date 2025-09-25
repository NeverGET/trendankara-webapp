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
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-3 md:px-4">
        <div className="flex items-center justify-between h-14 md:h-[72px]">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 md:gap-3">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-brand-red-600 rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg md:text-xl">T</span>
            </div>
            <span className="text-lg md:text-xl font-bold text-foreground hidden sm:block">
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
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
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
            className="md:hidden p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Menü"
          >
            <svg
              className="h-5 w-5"
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
        <div className="md:hidden absolute top-14 left-0 right-0 bg-background border-b border-border animate-slide-down">
          <nav className="container mx-auto px-4 py-4">
            {navigationItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'block py-3 px-4 rounded-lg text-base font-medium transition-all',
                  pathname === item.path
                    ? 'bg-accent text-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
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