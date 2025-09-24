'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { StreamTestRequest, StreamTestResponse } from '@/types/radioSettings';

interface StreamTestButtonProps {
  /** Stream URL to test */
  streamUrl: string;
  /** Callback function when test completes */
  onTestComplete?: (response: StreamTestResponse) => void;
  /** Callback function when test fails */
  onTestError?: (error: string) => void;
  /** Additional CSS classes */
  className?: string;
  /** Button size */
  size?: 'compact' | 'small' | 'medium' | 'large' | 'giant';
  /** Button variant */
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  /** Whether button should take full width */
  fullWidth?: boolean;
  /** Disabled state */
  disabled?: boolean;
}

// URL validation utility
function isValidUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;

  // Basic URL pattern - must start with http:// or https://
  const urlPattern = /^https?:\/\/.+/;
  if (!urlPattern.test(url)) return false;

  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function StreamTestButton({
  streamUrl,
  onTestComplete,
  onTestError,
  className,
  size = 'medium',
  variant = 'secondary',
  fullWidth = false,
  disabled = false
}: StreamTestButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [rateLimitInfo, setRateLimitInfo] = useState<{
    isLimited: boolean;
    resetTime: string;
    remaining: number;
  } | null>(null);
  const [countdown, setCountdown] = useState<number>(0);

  // Update countdown timer when rate limited
  useEffect(() => {
    if (!rateLimitInfo?.isLimited || countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          setRateLimitInfo(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [rateLimitInfo?.isLimited, countdown]);

  // Calculate countdown from reset time
  useEffect(() => {
    if (rateLimitInfo?.resetTime) {
      const resetDate = new Date(rateLimitInfo.resetTime);
      const now = new Date();
      const secondsUntilReset = Math.max(0, Math.floor((resetDate.getTime() - now.getTime()) / 1000));
      setCountdown(secondsUntilReset);
    }
  }, [rateLimitInfo?.resetTime]);

  // Handle stream test
  const handleTest = useCallback(async () => {
    // Check for empty URL (Requirement 2.2)
    if (!streamUrl || streamUrl.trim() === '') {
      const errorMessage = 'Lütfen test etmek için bir stream URL\'si girin';
      onTestError?.(errorMessage);
      return;
    }

    // Check for valid URL format (Requirement 2.3)
    if (!isValidUrl(streamUrl.trim())) {
      const errorMessage = 'Geçerli bir URL formatı girin';
      onTestError?.(errorMessage);
      return;
    }

    setIsLoading(true);

    try {
      const requestData: StreamTestRequest = {
        url: streamUrl.trim(),
        timeout: 10,
        includeMetadata: true
      };

      const response = await fetch('/api/admin/settings/radio/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ streamUrl: requestData.url }),
      });

      if (response.status === 429) {
        // Rate limit exceeded (Requirement 2.7)
        const errorData = await response.json();
        const resetTime = response.headers.get('X-RateLimit-Reset');
        const remaining = response.headers.get('X-RateLimit-Remaining');

        setRateLimitInfo({
          isLimited: true,
          resetTime: resetTime || new Date(Date.now() + 60000).toISOString(),
          remaining: remaining ? parseInt(remaining) : 0
        });

        onTestError?.('Test limiti aşıldı. Lütfen bir dakika bekleyin.');
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Stream test başarısız oldu');
      }

      // Convert API response to StreamTestResponse format
      const testResponse: StreamTestResponse = {
        result: {
          success: data.success,
          message: data.message,
          timestamp: new Date().toISOString(),
          details: data.details
        },
        metadata: data.metadata,
        rateLimit: {
          remaining: parseInt(response.headers.get('X-RateLimit-Remaining') || '0'),
          resetTime: response.headers.get('X-RateLimit-Reset') || new Date().toISOString(),
          limit: parseInt(response.headers.get('X-RateLimit-Limit') || '10')
        }
      };

      onTestComplete?.(testResponse);

    } catch (error) {
      console.error('Stream test error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen bir hata oluştu';
      onTestError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [streamUrl, onTestComplete, onTestError]);

  // Determine button state and text
  const getButtonContent = () => {
    if (rateLimitInfo?.isLimited && countdown > 0) {
      const minutes = Math.floor(countdown / 60);
      const seconds = countdown % 60;
      return `Bekle (${minutes}:${seconds.toString().padStart(2, '0')})`;
    }

    if (isLoading) {
      return 'Test Ediliyor...';
    }

    // Show button text based on URL state (Requirements 2.1, 2.2, 2.3)
    if (!streamUrl || streamUrl.trim() === '') {
      return 'Stream URL Test Et';
    }

    if (!isValidUrl(streamUrl.trim())) {
      return 'Stream URL Test Et';
    }

    return 'Stream URL Test Et';
  };

  const isButtonDisabled = disabled || isLoading || (rateLimitInfo?.isLimited && countdown > 0);

  return (
    <Button
      onClick={handleTest}
      disabled={isButtonDisabled}
      loading={isLoading}
      variant={variant}
      size={size}
      fullWidth={fullWidth}
      className={cn(
        'transition-all duration-200',
        rateLimitInfo?.isLimited && countdown > 0 && 'opacity-60 cursor-not-allowed',
        className
      )}
    >
      {getButtonContent()}
    </Button>
  );
}