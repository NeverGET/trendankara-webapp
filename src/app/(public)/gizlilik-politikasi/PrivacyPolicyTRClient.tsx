'use client';

import { privacyPolicyTR } from '@/lib/content/privacy-policy-tr';

export function PrivacyPolicyTRClient() {
  return (
    <div className="privacy-policy-page max-w-4xl mx-auto px-4 py-8">
      {/* Page Header */}
      <header className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-dark-text-primary mb-2">
          {privacyPolicyTR.title}
        </h1>
        <p className="text-sm text-dark-text-secondary">
          Son Güncelleme: {new Date(privacyPolicyTR.lastUpdated).toLocaleDateString('tr-TR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </header>

      {/* Table of Contents */}
      <nav className="mb-8 p-6 bg-dark-surface-secondary rounded-lg">
        <h2 className="text-lg md:text-xl font-semibold text-dark-text-primary mb-4">
          İçindekiler
        </h2>
        <ul className="space-y-2">
          {privacyPolicyTR.sections.map((section) => (
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
        {privacyPolicyTR.sections.map((section) => (
          <section key={section.id} id={section.id} className="scroll-mt-8">
            <h2 className="text-xl md:text-2xl font-semibold text-dark-text-primary mb-4">
              {section.title}
            </h2>
            <div className="text-sm md:text-base leading-relaxed text-dark-text-secondary whitespace-pre-wrap mb-4">
              {section.content}
            </div>

            {section.subsections && (
              <div className="space-y-4 mt-4">
                {section.subsections.map((subsection, index) => (
                  <div key={index} className="pl-4 border-l-2 border-dark-surface-secondary">
                    <h3 className="text-base md:text-lg font-semibold text-dark-text-primary mb-2">
                      {subsection.title}
                    </h3>
                    <div className="text-sm md:text-base leading-relaxed text-dark-text-secondary whitespace-pre-wrap">
                      {subsection.content}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        ))}
      </main>
    </div>
  );
}
