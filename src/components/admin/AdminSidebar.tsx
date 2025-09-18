'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import {
  FiHome,
  FiImage,
  FiSettings,
  FiFileText,
  FiBarChart2,
  FiUsers,
  FiMenu,
  FiX
} from 'react-icons/fi';

interface NavigationItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const navigationItems: NavigationItem[] = [
  {
    label: 'Panel',
    href: '/admin',
    icon: <FiHome className="w-5 h-5" />
  },
  {
    label: 'Haberler',
    href: '/admin/news',
    icon: <FiFileText className="w-5 h-5" />
  },
  {
    label: 'Anketler',
    href: '/admin/polls',
    icon: <FiBarChart2 className="w-5 h-5" />
  },
  {
    label: 'Medya',
    href: '/admin/media',
    icon: <FiImage className="w-5 h-5" />
  },
  {
    label: 'İçerik',
    href: '/admin/content',
    icon: <FiUsers className="w-5 h-5" />
  },
  {
    label: 'Ayarlar',
    href: '/admin/settings',
    icon: <FiSettings className="w-5 h-5" />
  }
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = React.useState(false);

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile Menu Toggle */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="fixed top-4 left-4 z-50 md:hidden p-2 rounded-lg bg-dark-surface-primary text-dark-text-primary hover:bg-dark-surface-secondary transition-colors"
        aria-label="Menu"
      >
        {isMobileOpen ? (
          <FiX className="w-6 h-6" />
        ) : (
          <FiMenu className="w-6 h-6" />
        )}
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-40 h-full w-64 bg-dark-bg-secondary border-r border-dark-border-primary transition-transform duration-300',
          'md:translate-x-0',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo/Header */}
          <div className="p-6 border-b border-dark-border-primary">
            <h2 className="text-2xl font-bold text-brand-red-600">
              Trend Ankara
            </h2>
            <p className="text-sm text-dark-text-secondary mt-1">
              Yönetim Paneli
            </p>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
                  'hover:bg-dark-surface-primary',
                  isActive(item.href)
                    ? 'bg-dark-surface-primary text-brand-red-600 font-medium'
                    : 'text-dark-text-secondary hover:text-dark-text-primary'
                )}
              >
                <span className={cn(
                  'transition-colors',
                  isActive(item.href) && 'text-brand-red-600'
                )}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* Bottom Section */}
          <div className="p-4 border-t border-dark-border-primary">
            <Button
              variant="ghost"
              size="small"
              fullWidth
              className="justify-start"
            >
              <FiHome className="w-4 h-4 mr-2" />
              Site Ana Sayfa
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}