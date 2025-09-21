'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface MobileNavigationProps {
  isOpen: boolean;
  onClose: () => void;
}

const navigationItems = [
  { label: 'Ana Sayfa', path: '/' },
  { label: 'Haberler', path: '/news' },
  { label: 'Anketler', path: '/polls' },
];

export function MobileNavigation({ isOpen, onClose }: MobileNavigationProps) {
  const pathname = usePathname();
  const drawerRef = useRef<HTMLDivElement>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Minimum swipe distance for gesture
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isRightSwipe && isOpen) {
      onClose();
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm animate-fade-in md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <div
        ref={drawerRef}
        className={cn(
          'fixed top-0 left-0 z-50 h-full w-72 bg-dark-bg-primary border-r border-dark-border-primary',
          'transition-transform duration-300 ease-out md:hidden',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-4 border-b border-dark-border-primary">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-red-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">T</span>
            </div>
            <span className="text-xl font-bold text-dark-text-primary">
              Trend Ankara
            </span>
          </div>
          <button
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] p-2 rounded-lg text-dark-text-secondary hover:text-dark-text-primary hover:bg-dark-surface-primary transition-all flex items-center justify-center"
            aria-label="Kapat"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="p-4 space-y-2">
          {navigationItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              onClick={onClose}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-all min-h-[44px]',
                pathname === item.path
                  ? 'bg-brand-red-600 text-white'
                  : 'text-dark-text-secondary hover:text-dark-text-primary hover:bg-dark-surface-primary'
              )}
            >
              <span className="w-2 h-2 rounded-full bg-current opacity-60" />
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-dark-border-primary">
          <p className="text-sm text-dark-text-tertiary text-center">
            © 2024 Trend Ankara Radio
          </p>
        </div>
      </div>
    </>
  );
}