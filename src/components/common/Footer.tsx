import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FaInstagram, FaWhatsapp } from 'react-icons/fa';

export function Footer() {
  return (
    <footer className="bg-dark-surface-primary border-t border-dark-border-primary mt-auto">
      <div className="container mx-auto px-3 md:px-4 py-6 md:py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-8">
          {/* Brand Section */}
          <div className="space-y-3 md:space-y-4">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg overflow-hidden flex items-center justify-center bg-black">
                <Image
                  src="/TrendAnkara_Logo.svg"
                  alt="Trend Ankara Logo"
                  width={40}
                  height={40}
                  className="w-full h-full object-contain"
                />
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
              <p>
                <a
                  href="tel:03122791110"
                  className="hover:text-dark-text-primary transition-colors"
                >
                  Reklam Hattı: 0312 279 11 10
                </a>
              </p>
              <p>
                <a
                  href="https://wa.me/903122830606"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-dark-text-primary transition-colors"
                >
                  İstek Hattı: 0312 283 06 06
                </a>
              </p>
            </div>
            {/* Social Links */}
            <div className="flex gap-3">
              <a
                href="https://www.instagram.com/radyotrendankara"
                target="_blank"
                rel="noopener noreferrer"
                className="min-w-[44px] min-h-[44px] w-11 h-11 md:w-10 md:h-10 rounded-lg bg-dark-surface-secondary flex items-center justify-center text-dark-text-secondary hover:bg-brand-red-600 hover:text-white transition-all"
                aria-label="Instagram"
              >
                <FaInstagram className="h-5 w-5" />
              </a>
              <a
                href="https://wa.me/903122830606"
                target="_blank"
                rel="noopener noreferrer"
                className="min-w-[44px] min-h-[44px] w-11 h-11 md:w-10 md:h-10 rounded-lg bg-dark-surface-secondary flex items-center justify-center text-dark-text-secondary hover:bg-brand-red-600 hover:text-white transition-all"
                aria-label="WhatsApp"
              >
                <FaWhatsapp className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Legal Section */}
          <div className="space-y-3 md:space-y-4">
            <h3 className="text-base md:text-lg font-semibold text-dark-text-primary">
              Yasal
            </h3>
            <nav className="space-y-2">
              <Link
                href="/kunye"
                className="block text-sm md:text-base text-dark-text-secondary hover:text-dark-text-primary transition-colors min-h-[44px] flex items-center"
              >
                Künye
              </Link>
              <Link
                href="/gizlilik-politikasi"
                className="block text-sm md:text-base text-dark-text-secondary hover:text-dark-text-primary transition-colors min-h-[44px] flex items-center"
              >
                Gizlilik Politikası
              </Link>
              <Link
                href="/kullanim-kosullari"
                className="block text-sm md:text-base text-dark-text-secondary hover:text-dark-text-primary transition-colors min-h-[44px] flex items-center"
              >
                Kullanım Koşulları
              </Link>
              <Link
                href="/privacy-policy"
                className="block text-sm md:text-base text-dark-text-secondary hover:text-dark-text-primary transition-colors min-h-[44px] flex items-center"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms-and-conditions"
                className="block text-sm md:text-base text-dark-text-secondary hover:text-dark-text-primary transition-colors min-h-[44px] flex items-center"
              >
                Terms & Conditions
              </Link>
            </nav>
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