'use client';

import { termsConditionsTR } from '@/lib/content/terms-conditions-tr';

export function TermsConditionsTRClient() {
  return (
    <div className="privacy-policy-page max-w-4xl mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-dark-text-primary mb-2">
          {termsConditionsTR.title}
        </h1>
        <p className="text-sm text-dark-text-secondary">
          Son güncelleme: {new Date(termsConditionsTR.lastUpdated).toLocaleDateString('tr-TR')}
        </p>
      </header>

      <div className="space-y-8">
        {termsConditionsTR.sections.map((section) => (
          <section key={section.id} id={section.id} className="scroll-mt-4">
            <h2 className="text-xl md:text-2xl font-semibold text-dark-text-primary mb-4">
              {section.title}
            </h2>

            {section.content && (
              <div className="text-dark-text-secondary mb-4 whitespace-pre-line leading-relaxed">
                {section.content}
              </div>
            )}

            {section.subsections && (
              <div className="space-y-4 ml-4">
                {section.subsections.map((subsection, index) => (
                  <div key={index}>
                    <h3 className="text-lg font-medium text-dark-text-primary mb-2">
                      {subsection.title}
                    </h3>
                    <div className="text-dark-text-secondary whitespace-pre-line leading-relaxed">
                      {subsection.content}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        ))}
      </div>

      <footer className="mt-12 pt-8 border-t border-dark-border">
        <p className="text-sm text-dark-text-secondary text-center">
          © {new Date().getFullYear()} SÜPER ŞOV GAZETE RADYO TELEVİZYON YAY.SANAYİ VE TİC. A.Ş. -
          Tüm hakları saklıdır.
        </p>
      </footer>
    </div>
  );
}
