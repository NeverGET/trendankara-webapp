'use client';

import { kunyeContent } from '@/lib/content/kunye';

export function KunyeClient() {
  return (
    <div className="kunye-page max-w-4xl mx-auto px-4 py-8">
      {/* Page Header */}
      <header className="mb-8 text-center">
        <h1 className="text-2xl md:text-3xl font-bold text-dark-primary mb-4">
          {kunyeContent.title}
        </h1>
        <div className="inline-block px-6 py-3 bg-dark-surface-secondary rounded-lg">
          <p className="text-lg md:text-xl font-semibold text-dark-text-primary">
            TRENDANKARA
          </p>
          <p className="text-sm text-dark-text-secondary mt-1">Radyo İstasyonu</p>
        </div>
      </header>

      {/* Content Sections */}
      <main className="space-y-8">
        {kunyeContent.sections.map((section) => (
          <section
            key={section.id}
            className="bg-dark-surface-secondary rounded-lg p-6 md:p-8"
          >
            <h2 className="text-xl md:text-2xl font-semibold text-dark-primary mb-6">
              {section.title}
            </h2>
            <div className="space-y-4">
              {section.items.map((item, index) => (
                <div
                  key={index}
                  className={item.label ? 'flex flex-col sm:flex-row sm:gap-4' : ''}
                >
                  {item.label && (
                    <dt className="font-semibold text-dark-text-primary min-w-[200px] mb-1 sm:mb-0">
                      {item.label}:
                    </dt>
                  )}
                  <dd className="text-dark-text-secondary">
                    {item.type === 'email' ? (
                      <a
                        href={`mailto:${item.value}`}
                        className="text-dark-primary hover:text-dark-primary-hover transition-colors"
                      >
                        {item.value}
                      </a>
                    ) : item.type === 'tel' ? (
                      <a
                        href={`tel:${item.value.replace(/\s/g, '')}`}
                        className="text-dark-primary hover:text-dark-primary-hover transition-colors"
                      >
                        {item.value}
                      </a>
                    ) : item.url ? (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-dark-primary hover:text-dark-primary-hover transition-colors"
                      >
                        {item.value}
                      </a>
                    ) : (
                      <span className={!item.label ? 'font-medium text-dark-text-primary' : ''}>
                        {item.value}
                      </span>
                    )}
                  </dd>
                </div>
              ))}
            </div>
          </section>
        ))}
      </main>

      {/* Footer Links */}
      <footer className="mt-12 pt-8 border-t border-dark-border">
        <div className="text-center text-sm text-dark-text-secondary">
          <p className="mb-4">Diğer Yasal Sayfalar:</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <a
              href="/gizlilik-politikasi"
              className="text-dark-primary hover:text-dark-primary-hover transition-colors"
            >
              Gizlilik Politikası
            </a>
            <a
              href="/kullanim-kosullari"
              className="text-dark-primary hover:text-dark-primary-hover transition-colors"
            >
              Kullanım Koşulları
            </a>
            <a
              href="/privacy-policy"
              className="text-dark-primary hover:text-dark-primary-hover transition-colors"
            >
              Privacy Policy (EN)
            </a>
            <a
              href="/terms-and-conditions"
              className="text-dark-primary hover:text-dark-primary-hover transition-colors"
            >
              Terms & Conditions (EN)
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
