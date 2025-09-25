'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  FiHome,
  FiImage,
  FiSettings,
  FiFileText,
  FiBarChart2,
  FiUsers,
  FiMenu,
  FiX,
  FiGrid,
  FiRadio
} from 'react-icons/fi';
import { RiNewspaperLine, RiBarChartBoxLine } from 'react-icons/ri';
import { HiOutlinePhotograph, HiOutlineTemplate } from 'react-icons/hi';
import { IoSettingsOutline } from 'react-icons/io5';

interface NavigationItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const navigationItems: NavigationItem[] = [
  {
    label: 'Panel',
    href: '/admin',
    icon: <FiGrid className="w-4 h-4 flex-shrink-0" />
  },
  {
    label: 'Haberler',
    href: '/admin/news',
    icon: <RiNewspaperLine className="w-4 h-4 flex-shrink-0" />
  },
  {
    label: 'Anketler',
    href: '/admin/polls',
    icon: <RiBarChartBoxLine className="w-4 h-4 flex-shrink-0" />
  },
  {
    label: 'Medya',
    href: '/admin/media',
    icon: <HiOutlinePhotograph className="w-4 h-4 flex-shrink-0" />
  },
  {
    label: 'Mobil Uygulama',
    href: '/admin/content',
    icon: <HiOutlineTemplate className="w-4 h-4 flex-shrink-0" />
  },
  {
    label: 'Ayarlar',
    href: '/admin/settings',
    icon: <IoSettingsOutline className="w-4 h-4 flex-shrink-0" />
  }
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = React.useState(false);

  const isActive = (href: string) => {
    if (!pathname) return false;
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
        className="fixed top-3 left-3 z-50 md:hidden px-2 py-2 rounded-lg bg-dark-surface-primary text-dark-text-primary hover:bg-dark-surface-secondary transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
        aria-label="Menu"
      >
        {isMobileOpen ? (
          <FiX className="w-5 h-5" />
        ) : (
          <FiMenu className="w-5 h-5" />
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
          'fixed top-0 left-0 z-40 h-full w-56 md:w-60 bg-gradient-to-b from-dark-bg-secondary to-dark-bg-primary border-r border-dark-border-primary/50 transition-transform duration-300',
          'md:translate-x-0 backdrop-blur-lg',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo/Header */}
          <div className="p-4 md:p-6 border-b border-dark-border-primary/50 bg-gradient-to-r from-brand-red-900/20 to-transparent">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="p-1.5 md:p-2 bg-gradient-to-br from-brand-red-600 to-brand-red-700 rounded-lg shadow-lg shadow-brand-red-900/50">
                <FiRadio className="w-4 h-4 md:w-6 md:h-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg md:text-2xl font-bold bg-gradient-to-r from-brand-red-600 to-brand-red-500 bg-clip-text text-transparent">
                  Trend Ankara
                </h2>
                <p className="text-[10px] md:text-xs text-dark-text-secondary mt-0.5">
                  Yönetim Paneli
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 p-3 md:p-4 space-y-1 overflow-y-auto">
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileOpen(false)}
                className={cn(
                  'group flex items-center gap-2 md:gap-3 px-3 py-1 text-xs rounded-xl transition-all duration-300 relative overflow-hidden min-h-[44px]',
                  'hover:bg-gradient-to-r hover:from-dark-surface-primary/80 hover:to-dark-surface-secondary/50',
                  'hover:shadow-lg hover:shadow-black/20',
                  isActive(item.href)
                    ? 'bg-gradient-to-r from-brand-red-900/30 to-brand-red-900/10 text-brand-red-500 font-medium border border-brand-red-900/30'
                    : 'text-dark-text-secondary hover:text-dark-text-primary border border-transparent'
                )}
              >
                <span className={cn(
                  'transition-all duration-300 p-1.5 md:p-2 rounded-lg',
                  isActive(item.href)
                    ? 'bg-gradient-to-br from-brand-red-600/20 to-brand-red-700/10 text-brand-red-500 shadow-lg shadow-brand-red-900/20'
                    : 'bg-dark-surface-primary/50 group-hover:bg-dark-surface-secondary group-hover:shadow-md'
                )}>
                  {item.icon}
                </span>
                <span className="text-xs font-medium">{item.label}</span>
                {isActive(item.href) && (
                  <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-brand-red-600 to-brand-red-700 rounded-r-full" />
                )}
              </Link>
            ))}
          </nav>

          {/* Bottom Section */}
          <div className="p-4 border-t border-dark-border-primary/50 bg-gradient-to-t from-dark-surface-primary/30 to-transparent">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start group hover:pl-6 transition-all duration-300"
            >
              <FiHome className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
              <span className="font-medium">Site Ana Sayfa</span>
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}