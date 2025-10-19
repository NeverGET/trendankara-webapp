'use client';

import { termsConditionsEN } from '@/lib/content/terms-conditions-en';

export function TermsConditionsENClient() {
  return (
    <div className="terms-conditions-page max-w-4xl mx-auto px-4 py-8">
      {/* Page Header */}
      <header className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-dark-text-primary mb-2">
          {termsConditionsEN.title}
        </h1>
        <p className="text-sm text-dark-text-secondary">
          Last Updated:{' '}
          {new Date(termsConditionsEN.lastUpdated).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </header>

      {/* Table of Contents */}
      <nav className="mb-8 p-6 bg-dark-surface-secondary rounded-lg">
        <h2 className="text-lg md:text-xl font-semibold text-dark-text-primary mb-4">
          Table of Contents
        </h2>
        <ul className="space-y-2">
          {termsConditionsEN.sections.map((section) => (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                className="text-dark-text-secondary hover:text-dark-text-primary transition-colors min-h-[44px] flex items-center"
              >
                {section.title}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {/* Content Sections */}
      <main className="space-y-8">
        {termsConditionsEN.sections.map((section) => (
          <section key={section.id} id={section.id} className="scroll-mt-8">
            <h2 className="text-xl md:text-2xl font-semibold text-dark-text-primary mb-4">
              {section.title}
            </h2>
            <div className="text-sm md:text-base leading-relaxed text-dark-text-secondary whitespace-pre-wrap mb-4">
              {section.content}
            </div>
          </section>
        ))}
      </main>

      {/* Footer Links */}
      <footer className="mt-12 pt-8 border-t border-dark-border">
        <div className="text-center text-sm text-dark-text-secondary">
          <p className="mb-4">For more information, please visit:</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <a
              href="/privacy-policy"
              className="text-dark-primary hover:text-dark-primary-hover transition-colors"
            >
              Privacy Policy
            </a>
            <a
              href="/kullanim-kosullari"
              className="text-dark-primary hover:text-dark-primary-hover transition-colors"
            >
              Kullanım Koşulları (TR)
            </a>
            <a
              href="/kunye"
              className="text-dark-primary hover:text-dark-primary-hover transition-colors"
            >
              Künye
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
