/**
 * Privacy Policy Content Types
 *
 * Type definitions for privacy policy content structure
 * Used by content modules and client components for type safety
 */

export interface PrivacyPolicyContent {
  /** Page title */
  title: string;
  /** Last updated date in ISO format (e.g., "2025-10-18") */
  lastUpdated: string;
  /** All content sections */
  sections: Section[];
}

export interface Section {
  /** Anchor ID for navigation (e.g., "data-controller") */
  id: string;
  /** Section heading */
  title: string;
  /** Section content (text or React elements) */
  content: string;
  /** Optional nested subsections */
  subsections?: Subsection[];
}

export interface Subsection {
  /** Subsection heading */
  title: string;
  /** Subsection content */
  content: string;
}
