# Implementation Plan - Privacy Policy Feature

## Task Overview

This implementation follows a bottom-up approach, starting with content modules, then page components, and finally integrating with the footer. All tasks are designed to be atomic (1-3 files, 15-30 minutes, single purpose) for optimal agent execution.

## Steering Document Compliance

**Structure.md Alignment:**
- Files organized under `src/app/(public)/` for public routes
- Content modules in `src/lib/content/` following existing pattern
- Server+Client component split matching `/news/page.tsx` pattern

**Tech.md Alignment:**
- Next.js 15 App Router with `force-dynamic` exports
- Tailwind CSS dark mode utilities (`dark-text-*`, `dark-surface-*`)
- TypeScript interfaces for type safety
- Mobile-first responsive design (14px base, 44px touch targets)

## Atomic Task Requirements

Each task meets these criteria:
- **File Scope**: Touches 1-3 related files maximum
- **Time Boxing**: Completable in 15-30 minutes
- **Single Purpose**: One testable outcome per task
- **Specific Files**: Exact file paths provided
- **Agent-Friendly**: Clear input/output with minimal context switching

## Tasks

### Phase 1: Content Module Foundation

- [x] 1. Create TypeScript interfaces for privacy policy content structure in src/types/privacy-policy.ts
  - File: `src/types/privacy-policy.ts`
  - Define `PrivacyPolicyContent`, `Section`, and `Subsection` interfaces
  - Export interfaces for use in content modules and components
  - Purpose: Establish type safety for all privacy policy content
  - _Leverage: Existing type organization in src/types/_
  - _Requirements: 4.0 (all content requirements depend on this structure)_

- [x] 2. Create Turkish privacy policy content module with KVKK-compliant sections in src/lib/content/privacy-policy-tr.ts
  - File: `src/lib/content/privacy-policy-tr.ts`
  - Import interfaces from `src/types/privacy-policy.ts`
  - Define `privacyPolicyTR` object with all 11 sections (Data Controller, Data Collection, Processing Purpose, Data Transfer, Retention, Security, User Rights/KVKK Article 11, Cookies, Children's Privacy, Policy Changes, Contact)
  - Include placeholders for company-specific information ([Company Legal Name], [Physical Address], [Contact Phone])
  - Set `lastUpdated` to current date (2025-10-18)
  - Purpose: Provide complete Turkish KVKK-compliant privacy policy content
  - _Leverage: Content module pattern from existing code_
  - _Requirements: 1.1, 1.5, 1.6, 1.7, 4.1-4.5, 5.1-5.5, 6.1-6.4, 7.1-7.5, 8.1-8.3, 9.1-9.9, 10.1-10.4_

- [ ] 3. Create English privacy policy content module with parallel structure in src/lib/content/privacy-policy-en.ts
  - File: `src/lib/content/privacy-policy-en.ts`
  - Import interfaces from `src/types/privacy-policy.ts`
  - Define `privacyPolicyEN` object with same 11 sections as Turkish version (bilingual symmetry)
  - Translate KVKK Article 11 rights to English equivalents
  - Include same placeholders for company information
  - Set `lastUpdated` to current date (2025-10-18)
  - Purpose: Provide complete English privacy policy content
  - _Leverage: Content module pattern, Turkish content structure for consistency_
  - _Requirements: 2.1, 2.5, 4.1-4.5, 5.1-5.5, 6.1-6.4, 7.1-7.5, 8.1-8.3, 9.1-9.9 (English), 10.1-10.4_

### Phase 2: Turkish Privacy Policy Pages

- [ ] 4. Create Turkish privacy policy server component with metadata in src/app/(public)/gizlilik-politikasi/page.tsx
  - File: `src/app/(public)/gizlilik-politikasi/page.tsx`
  - Export `dynamic = 'force-dynamic'` for server-side rendering
  - Export `metadata` object with Turkish title, description, `robots: 'noindex, nofollow'`, language alternate links
  - Import and render `PrivacyPolicyTRClient` component
  - Purpose: Server wrapper for Turkish privacy policy with SEO metadata
  - _Leverage: src/app/(public)/news/page.tsx pattern (server component with metadata)_
  - _Requirements: 1.1, 1.4, 11.1, 11.2, 11.4_

- [ ] 5. Create Turkish privacy policy client component with table of contents in src/app/(public)/gizlilik-politikasi/PrivacyPolicyTRClient.tsx
  - File: `src/app/(public)/gizlilik-politikasi/PrivacyPolicyTRClient.tsx`
  - Mark as `'use client'`
  - Import `privacyPolicyTR` from `@/lib/content/privacy-policy-tr`
  - Render page header with title and last updated date
  - Render table of contents with anchor links (all section IDs)
  - Use `min-h-[44px] flex items-center` for TOC links (touch-friendly)
  - Purpose: Interactive Turkish privacy policy page with navigation
  - _Leverage: Dark mode utilities (dark-text-primary, dark-surface-primary), touch target patterns from Footer_
  - _Requirements: 1.1, 1.3, 1.5, 12.1, 12.3, 12.4_

- [ ] 6. Add content sections rendering with proper styling in src/app/(public)/gizlilik-politikasi/PrivacyPolicyTRClient.tsx
  - File: `src/app/(public)/gizlilik-politikasi/PrivacyPolicyTRClient.tsx` (continue from task 5)
  - Map over `privacyPolicyTR.sections` to render all sections
  - Apply semantic HTML structure (h2 for section titles, h3 for subsections)
  - Use typography classes: `text-sm md:text-base`, `leading-relaxed` (1.6 line height)
  - Add anchor IDs to sections for TOC navigation
  - Apply dark mode styling: `text-dark-text-primary` for headings, `text-dark-text-secondary` for content
  - Purpose: Render complete policy content with mobile-responsive typography
  - _Leverage: Typography utilities from tailwind.config.ts (14px mobile, 16px desktop, 1.6 line height)_
  - _Requirements: 1.3, 1.6, 1.7, 12.2_

- [ ] 7. Implement smooth scroll behavior for table of contents navigation in src/app/(public)/gizlilik-politikasi/PrivacyPolicyTRClient.tsx
  - File: `src/app/(public)/gizlilik-politikasi/PrivacyPolicyTRClient.tsx` (continue from task 6)
  - Add click handler to TOC links that calls `document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' })`
  - Or use Next.js Link with hash hrefs (e.g., `href="#data-controller"`) for native anchor behavior
  - Ensure all section IDs match TOC anchor hrefs exactly
  - Purpose: Enable smooth navigation from TOC to sections
  - _Leverage: Native browser anchor behavior or React smooth scroll_
  - _Requirements: 12.2_

### Phase 3: English Privacy Policy Pages

- [ ] 8. Create English privacy policy server component with metadata in src/app/(public)/privacy-policy/page.tsx
  - File: `src/app/(public)/privacy-policy/page.tsx`
  - Export `dynamic = 'force-dynamic'` for server-side rendering
  - Export `metadata` object with English title, description, `robots: 'noindex, nofollow'`, language alternate links
  - Import and render `PrivacyPolicyENClient` component
  - Purpose: Server wrapper for English privacy policy with SEO metadata
  - _Leverage: src/app/(public)/gizlilik-politikasi/page.tsx (mirror Turkish server component)_
  - _Requirements: 2.1, 2.4, 11.1, 11.2, 11.4_

- [ ] 9. Create English privacy policy client component (duplicate Turkish structure with English content) in src/app/(public)/privacy-policy/PrivacyPolicyENClient.tsx
  - File: `src/app/(public)/privacy-policy/PrivacyPolicyENClient.tsx`
  - Mark as `'use client'`
  - Import `privacyPolicyEN` from `@/lib/content/privacy-policy-en`
  - Copy structure from `PrivacyPolicyTRClient.tsx` (page header, TOC, sections, smooth scroll)
  - Replace Turkish content with English content import
  - Use identical styling and structure for bilingual consistency
  - Purpose: Complete English privacy policy page with identical features to Turkish version
  - _Leverage: src/app/(public)/gizlilik-politikasi/PrivacyPolicyTRClient.tsx (copy structure), dark mode and typography utilities_
  - _Requirements: 2.1, 2.3, 2.5, 12.1, 12.2, 12.3, 12.4_

### Phase 4: Footer Integration

- [ ] 10. Add "Yasal" (Legal) section with privacy policy links to Footer component in src/components/common/Footer.tsx
  - File: `src/components/common/Footer.tsx`
  - Modify grid from `grid-cols-1 md:grid-cols-3` to `grid-cols-1 md:grid-cols-4`
  - Add new 4th column with heading "Yasal" (`text-base md:text-lg font-semibold text-dark-text-primary`)
  - Add Link to `/gizlilik-politikasi` with text "Gizlilik Politikas1"
  - Add Link to `/privacy-policy` with text "Privacy Policy"
  - Apply same link styling as existing Quick Links: `text-dark-text-secondary hover:text-dark-text-primary transition-colors min-h-[44px] flex items-center`
  - Purpose: Provide footer access to privacy policy pages from all public pages
  - _Leverage: Existing Footer structure and link styling patterns_
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

### Phase 5: Print Styling

- [ ] 11. Add print-specific CSS styles to globals.css for privacy policy pages
  - File: `src/app/globals.css`
  - Add `@media print` block with styles for `.privacy-policy-page` class
  - Hide navigation elements in print (Header, Footer, TOC)
  - Ensure proper page breaks between major sections (`page-break-inside: avoid` on sections)
  - Add print header with page URL and last updated date using CSS `::before` pseudo-element
  - Set readable print font size (12pt minimum)
  - Purpose: Provide print-friendly formatting for saving/archiving privacy policy
  - _Leverage: Existing print utility patterns in globals.css_
  - _Requirements: 13.1, 13.2, 13.3_

- [ ] 12. Apply `.privacy-policy-page` wrapper class to both Turkish and English client components
  - Files: `src/app/(public)/gizlilik-politikasi/PrivacyPolicyTRClient.tsx`, `src/app/(public)/privacy-policy/PrivacyPolicyENClient.tsx`
  - Wrap entire page content in a div with `className="privacy-policy-page"`
  - This enables print styles from task 11 to apply
  - Purpose: Enable print-specific styling for privacy policy pages
  - _Leverage: Print styles defined in globals.css_
  - _Requirements: 13.1, 13.2, 13.3_

### Phase 6: Content Finalization (Placeholder Replacement)

- [ ] 13. Replace content placeholders in Turkish privacy policy module with actual company information
  - File: `src/lib/content/privacy-policy-tr.ts`
  - Replace `[Company Legal Name]` with actual legal entity name
  - Replace `[Physical Address]` with actual Turkish address
  - Replace `[Contact Phone]` with actual phone number
  - Verify `privacy@trendankara.com` email or update to actual privacy contact email
  - Update `lastUpdated` date if needed
  - Purpose: Complete privacy policy with real company information for compliance
  - _Leverage: Existing content structure_
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ] 14. Replace content placeholders in English privacy policy module with actual company information
  - File: `src/lib/content/privacy-policy-en.ts`
  - Replace same placeholders as task 13 (company name, address, phone, email)
  - Ensure consistency with Turkish version
  - Update `lastUpdated` date if needed
  - Purpose: Complete English privacy policy with real company information
  - _Leverage: Turkish content for consistency_
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

### Phase 7: Testing and Validation

- [ ] 15. Test Turkish privacy policy page on mobile and desktop viewports
  - Files to test: `src/app/(public)/gizlilik-politikasi/page.tsx`, `src/app/(public)/gizlilik-politikasi/PrivacyPolicyTRClient.tsx`
  - Navigate to `/gizlilik-politikasi` in development environment
  - Verify page loads within 3 seconds
  - Test on mobile viewport (375px): Verify 14px+ font, 1.6 line height, 44px touch targets on TOC links
  - Test on desktop viewport (1024px): Verify responsive scaling, readable layout
  - Test TOC navigation: Click links to verify smooth scroll to sections
  - Test print functionality: Open print preview (Ctrl+P / Cmd+P), verify formatting
  - Purpose: Validate Turkish privacy policy meets all functional and non-functional requirements
  - _Leverage: Browser DevTools for viewport testing and print preview_
  - _Requirements: 1.1, 1.2, 1.3, 12.1, 12.2, 12.4, 13.1_

- [ ] 16. Test English privacy policy page on mobile and desktop viewports
  - Files to test: `src/app/(public)/privacy-policy/page.tsx`, `src/app/(public)/privacy-policy/PrivacyPolicyENClient.tsx`
  - Navigate to `/privacy-policy` in development environment
  - Perform same tests as task 15 (load time, mobile/desktop viewports, TOC navigation, print)
  - Verify bilingual consistency with Turkish version (same layout, styling, features)
  - Purpose: Validate English privacy policy meets all functional and non-functional requirements
  - _Leverage: Test procedure from task 15_
  - _Requirements: 2.1, 2.2, 2.3, 12.1, 12.2, 12.4, 13.1_

- [ ] 17. Test footer integration across all public pages
  - Files to test: `src/components/common/Footer.tsx`, all public pages (`/`, `/news`, `/polls`, privacy policy pages)
  - Navigate to homepage, news page, polls page, and privacy policy pages
  - Verify "Yasal" section appears in footer on all pages
  - Verify both privacy policy links are present and clickable
  - Test link navigation: Click "Gizlilik Politikas1" � should navigate to `/gizlilik-politikasi`
  - Test link navigation: Click "Privacy Policy" � should navigate to `/privacy-policy`
  - Test on mobile: Verify touch targets are 44px minimum height
  - Purpose: Validate footer integration and accessibility from all public pages
  - _Leverage: Browser DevTools for touch target measurement_
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

---

**Document Status**: Ready for Implementation
**Created**: October 18, 2025
**Phase**: Tasks (Phase 3 of 4)
**Total Tasks**: 17 atomic tasks
**Estimated Duration**: ~6-8 hours for complete implementation
**Next Step**: Execute tasks sequentially or generate task commands for individual execution
