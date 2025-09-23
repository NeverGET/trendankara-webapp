/**
 * Stream URL Validator Service
 * Centralized URL validation and format correction logic for radio stream URLs
 * Requirements: 3.1, 3.2, 3.3
 */

import { URLValidationResult } from '@/types/radioSettings';

/**
 * Configuration options for URL validation
 */
export interface ValidationOptions {
  /** Maximum URL length allowed (default: 2048) */
  maxLength?: number;
  /** Minimum URL length required (default: 10) */
  minLength?: number;
  /** Whether to allow HTTP protocol (default: true) */
  allowHttp?: boolean;
  /** Whether to auto-correct common URL format issues (default: true) */
  autoCorrect?: boolean;
}

/**
 * Default validation options
 */
const DEFAULT_OPTIONS: Required<ValidationOptions> = {
  maxLength: 2048,
  minLength: 10,
  allowHttp: true,
  autoCorrect: true
};

/**
 * StreamUrlValidator provides comprehensive URL validation and format correction
 * for radio streaming URLs with support for common URL issues and security warnings
 */
export class StreamUrlValidator {
  private options: Required<ValidationOptions>;

  constructor(options: ValidationOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Validates a stream URL with comprehensive format checking
   * Requirement 3.1: Suggests removing "/stream" endings
   * Requirement 3.2: Auto-corrects file extensions like "/index.html"
   * Requirement 3.3: Warns about HTTP protocol security implications
   */
  validateUrl(url: string): URLValidationResult {
    // Early validation for empty or null URLs
    if (!url || typeof url !== 'string') {
      return {
        isValid: false,
        message: 'URL is required and must be a valid string',
        errorType: 'format',
        suggestions: ['Please enter a valid stream URL (e.g., https://stream.example.com:8000/)']
      };
    }

    // Trim whitespace
    const trimmedUrl = url.trim();

    // Length validation
    if (trimmedUrl.length < this.options.minLength) {
      return {
        isValid: false,
        message: `URL is too short (minimum ${this.options.minLength} characters)`,
        errorType: 'length',
        suggestions: ['Please enter a complete stream URL including protocol and domain']
      };
    }

    if (trimmedUrl.length > this.options.maxLength) {
      return {
        isValid: false,
        message: `URL is too long (maximum ${this.options.maxLength} characters)`,
        errorType: 'length',
        suggestions: ['Please shorten the URL or remove unnecessary parameters']
      };
    }

    // Attempt to parse URL
    let parsedUrl: URL;
    try {
      // Add protocol if missing
      const urlToParse = this.addProtocolIfMissing(trimmedUrl);
      parsedUrl = new URL(urlToParse);
    } catch (error) {
      return {
        isValid: false,
        message: 'Invalid URL format',
        errorType: 'format',
        suggestions: [
          'Ensure URL includes protocol (http:// or https://)',
          'Check for typos in domain name',
          'Example: https://stream.example.com:8000/'
        ]
      };
    }

    // Protocol validation
    const protocolResult = this.validateProtocol(parsedUrl.protocol);
    if (!protocolResult.isValid) {
      return protocolResult;
    }

    // Hostname validation
    const hostnameResult = this.validateHostname(parsedUrl.hostname);
    if (!hostnameResult.isValid) {
      return hostnameResult;
    }

    // Check for common URL format issues and provide corrections
    const suggestions: string[] = [];
    let correctedUrl = trimmedUrl;

    // Auto-correct common issues if enabled
    if (this.options.autoCorrect) {
      const correctionResult = this.correctUrlFormat(trimmedUrl);
      if (correctionResult.corrected !== trimmedUrl) {
        correctedUrl = correctionResult.corrected;
        suggestions.push(`Suggested URL: ${correctedUrl}`);
        if (correctionResult.reason) {
          suggestions.push(correctionResult.reason);
        }
      }
    }

    // Security warning for HTTP protocol
    const isHttps = parsedUrl.protocol === 'https:';
    if (!isHttps && this.options.allowHttp) {
      suggestions.push('⚠️ HTTP streams may have security implications. Consider using HTTPS if available.');
    }

    // Build result with detailed information
    const result: URLValidationResult = {
      isValid: true,
      message: correctedUrl !== trimmedUrl
        ? 'URL is valid with suggested corrections'
        : 'URL format is valid',
      suggestions: suggestions.length > 0 ? suggestions : undefined,
      details: {
        protocolValid: true,
        lengthValid: true,
        hostnameValid: true,
        parsedUrl: {
          protocol: parsedUrl.protocol,
          hostname: parsedUrl.hostname,
          port: parsedUrl.port ? parseInt(parsedUrl.port, 10) : undefined,
          pathname: parsedUrl.pathname
        }
      }
    };

    return result;
  }

  /**
   * Auto-corrects common URL format issues
   * Requirement 3.1: Removes "/stream" endings
   * Requirement 3.2: Removes file extensions like "/index.html"
   */
  correctUrlFormat(url: string): { corrected: string; reason?: string } {
    let corrected = url.trim();
    let reason: string | undefined;

    try {
      const parsedUrl = new URL(this.addProtocolIfMissing(corrected));
      let pathname = parsedUrl.pathname;
      let hasChanges = false;

      // Requirement 3.1: Remove "/stream" endings
      if (pathname.endsWith('/stream')) {
        pathname = pathname.slice(0, -7); // Remove "/stream"
        hasChanges = true;
        reason = 'Removed "/stream" suffix - base URL format is recommended for better compatibility';
      } else if (pathname.endsWith('/stream/')) {
        pathname = pathname.slice(0, -8); // Remove "/stream/"
        hasChanges = true;
        reason = 'Removed "/stream/" suffix - base URL format is recommended for better compatibility';
      }

      // Requirement 3.2: Remove common file extensions
      const fileExtensions = ['/index.html', '/index.htm', '/playlist.m3u', '/listen.pls', '/stream.mp3', '/radio.aac'];
      for (const ext of fileExtensions) {
        if (pathname.endsWith(ext)) {
          pathname = pathname.slice(0, -ext.length);
          hasChanges = true;
          reason = `Removed "${ext}" - base URL format is recommended for streaming compatibility`;
          break;
        }
      }

      // Ensure pathname ends with "/" for directory-style URLs
      if (hasChanges && pathname && !pathname.endsWith('/')) {
        pathname += '/';
      }

      // If we made changes, reconstruct the URL
      if (hasChanges) {
        parsedUrl.pathname = pathname;
        corrected = parsedUrl.toString();
      }

    } catch (error) {
      // If URL parsing fails, return original URL
      return { corrected: url };
    }

    return { corrected, reason };
  }

  /**
   * Validates URL protocol (HTTP/HTTPS)
   * Requirement 3.3: Warns about HTTP security implications
   */
  private validateProtocol(protocol: string): URLValidationResult {
    const validProtocols = ['http:', 'https:'];

    if (!validProtocols.includes(protocol)) {
      return {
        isValid: false,
        message: 'Invalid protocol. Only HTTP and HTTPS are supported for streaming URLs',
        errorType: 'protocol',
        suggestions: [
          'Use https:// for secure connections (recommended)',
          'Use http:// if HTTPS is not available',
          'Example: https://stream.example.com:8000/'
        ],
        details: { protocolValid: false }
      };
    }

    return {
      isValid: true,
      message: 'Protocol is valid',
      details: { protocolValid: true }
    };
  }

  /**
   * Validates hostname format and structure
   */
  private validateHostname(hostname: string): URLValidationResult {
    if (!hostname || hostname.length === 0) {
      return {
        isValid: false,
        message: 'Hostname is required',
        errorType: 'hostname',
        suggestions: ['Please provide a valid domain name (e.g., stream.example.com)'],
        details: { hostnameValid: false }
      };
    }

    // Basic hostname validation
    const hostnameRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    if (!hostnameRegex.test(hostname)) {
      return {
        isValid: false,
        message: 'Invalid hostname format',
        errorType: 'hostname',
        suggestions: [
          'Check for typos in the domain name',
          'Ensure hostname contains only letters, numbers, dots, and hyphens',
          'Example: stream.example.com'
        ],
        details: { hostnameValid: false }
      };
    }

    // Check for localhost/IP addresses (informational)
    if (hostname === 'localhost' || hostname.startsWith('127.') || hostname.startsWith('192.168.') || hostname.startsWith('10.')) {
      return {
        isValid: true,
        message: 'Local/private network hostname detected',
        suggestions: ['Local streams may not be accessible from all devices'],
        details: { hostnameValid: true }
      };
    }

    return {
      isValid: true,
      message: 'Hostname is valid',
      details: { hostnameValid: true }
    };
  }

  /**
   * Adds protocol prefix if missing from URL
   */
  private addProtocolIfMissing(url: string): string {
    if (!/^https?:\/\//i.test(url)) {
      // Default to HTTPS for security
      return `https://${url}`;
    }
    return url;
  }

  /**
   * Quick validation for simple use cases
   * Returns true if URL is valid, false otherwise
   */
  isValidUrl(url: string): boolean {
    return this.validateUrl(url).isValid;
  }

  /**
   * Gets suggested corrections for a URL without full validation
   */
  getSuggestions(url: string): string[] {
    const result = this.validateUrl(url);
    return result.suggestions || [];
  }

  /**
   * Static helper method for quick URL validation
   */
  static validate(url: string, options?: ValidationOptions): URLValidationResult {
    const validator = new StreamUrlValidator(options);
    return validator.validateUrl(url);
  }

  /**
   * Static helper method for URL format correction
   */
  static correct(url: string): { corrected: string; reason?: string } {
    const validator = new StreamUrlValidator();
    return validator.correctUrlFormat(url);
  }
}

/**
 * Default validator instance for simple usage
 */
export const streamUrlValidator = new StreamUrlValidator();

/**
 * Convenience function for quick URL validation
 */
export function validateStreamUrl(url: string, options?: ValidationOptions): URLValidationResult {
  return StreamUrlValidator.validate(url, options);
}

/**
 * Convenience function for URL format correction
 */
export function correctStreamUrlFormat(url: string): { corrected: string; reason?: string } {
  return StreamUrlValidator.correct(url);
}