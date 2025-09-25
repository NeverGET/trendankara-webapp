import React from 'react';
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-dark-surface-primary border-t border-dark-border-primary mt-auto">
      <div className="container mx-auto px-3 md:px-4 py-6 md:py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {/* Brand Section */}
          <div className="space-y-3 md:space-y-4">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-brand-red-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg md:text-xl">T</span>
              </div>
              <span className="text-lg md:text-xl font-bold text-dark-text-primary">
                Trend Ankara
              </span>
            </div>
            <p className="text-dark-text-secondary text-xs md:text-sm">
              {"Türkiye'nin en iyi radyo istasyonu. 24/7 kesintisiz müzik yayını."}
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-3 md:space-y-4">
            <h3 className="text-base md:text-lg font-semibold text-dark-text-primary">
              Hızlı Linkler
            </h3>
            <nav className="space-y-2">
              <Link
                href="/"
                className="block text-sm md:text-base text-dark-text-secondary hover:text-dark-text-primary transition-colors min-h-[44px] flex items-center"
              >
                Ana Sayfa
              </Link>
              <Link
                href="/news"
                className="block text-sm md:text-base text-dark-text-secondary hover:text-dark-text-primary transition-colors min-h-[44px] flex items-center"
              >
                Haberler
              </Link>
              <Link
                href="/polls"
                className="block text-sm md:text-base text-dark-text-secondary hover:text-dark-text-primary transition-colors min-h-[44px] flex items-center"
              >
                Anketler
              </Link>
            </nav>
          </div>

          {/* Contact Info */}
          <div className="space-y-3 md:space-y-4">
            <h3 className="text-base md:text-lg font-semibold text-dark-text-primary">
              İletişim
            </h3>
            <div className="space-y-1.5 md:space-y-2 text-dark-text-secondary text-xs md:text-sm">
              <p>Email: info@trendankara.com</p>
              <p>Telefon: +90 312 XXX XX XX</p>
              <p>Adres: Ankara, Türkiye</p>
            </div>
            {/* Social Links */}
            <div className="flex gap-3">
              <a
                href="#"
                className="min-w-[44px] min-h-[44px] w-11 h-11 md:w-10 md:h-10 rounded-lg bg-dark-surface-secondary flex items-center justify-center text-dark-text-secondary hover:bg-brand-red-600 hover:text-white transition-all"
                aria-label="Facebook"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
                </svg>
              </a>
              <a
                href="#"
                className="min-w-[44px] min-h-[44px] w-11 h-11 md:w-10 md:h-10 rounded-lg bg-dark-surface-secondary flex items-center justify-center text-dark-text-secondary hover:bg-brand-red-600 hover:text-white transition-all"
                aria-label="Twitter"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z" />
                </svg>
              </a>
              <a
                href="#"
                className="min-w-[44px] min-h-[44px] w-11 h-11 md:w-10 md:h-10 rounded-lg bg-dark-surface-secondary flex items-center justify-center text-dark-text-secondary hover:bg-brand-red-600 hover:text-white transition-all"
                aria-label="Instagram"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" fill="none" stroke="currentColor" strokeWidth="2" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </a>
              <a
                href="#"
                className="min-w-[44px] min-h-[44px] w-11 h-11 md:w-10 md:h-10 rounded-lg bg-dark-surface-secondary flex items-center justify-center text-dark-text-secondary hover:bg-brand-red-600 hover:text-white transition-all"
                aria-label="YouTube"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M22.54 6.42a2.78 2.78 0 00-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 00-1.94 2A29 29 0 001 12a29 29 0 00.46 5.58A2.78 2.78 0 003.4 19.6C5.12 20 12 20 12 20s6.88 0 8.6-.46a2.78 2.78 0 001.94-2A29 29 0 0023 12a29 29 0 00-.46-5.58z" />
                  <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="white" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-8 border-t border-dark-border-primary">
          <p className="text-center text-dark-text-tertiary text-sm">
            © 2024 Trend Ankara Radio. Tüm hakları saklıdır.
          </p>
        </div>
      </div>
    </footer>
  );
}