'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { AudioPreviewPlayer } from '@/components/admin/AudioPreviewPlayer';
import { MetadataDisplay } from '@/components/admin/MetadataDisplay';
import { StreamTestResult, StreamMetadata } from '@/types/radioSettings';
import { cn } from '@/lib/utils';

interface StreamPreviewSectionProps {
  /** Stream test result to determine if preview should be shown */
  testResult?: StreamTestResult;
  /** Stream URL for preview playback */
  streamUrl?: string;
  /** Stream metadata to display */
  metadata?: StreamMetadata;
  /** Loading state for metadata */
  metadataLoading?: boolean;
  /** CSS class for styling */
  className?: string;
  /** Callback when preview starts */
  onPreviewStart?: () => void;
  /** Callback when preview stops */
  onPreviewStop?: () => void;
  /** Show compact layout for smaller spaces */
  compact?: boolean;
}

/**
 * Stream Preview Section Component
 *
 * Combines AudioPreviewPlayer and MetadataDisplay components in an organized section
 * Only displays after successful stream test results
 *
 * Features:
 * - Conditional rendering based on stream test success
 * - Organized layout with Card wrapper and section title
 * - Integration of audio preview and metadata display
 * - State management for parent form integration
 * - Turkish language support
 * - Responsive design with compact mode
 *
 * Requirements:
 * - 3.1: Display preview functionality after successful stream test
 * - 4.1: Extract and display metadata after successful stream test
 * - 4.2: Display stream title, bitrate, audio format, and server information
 */
export function StreamPreviewSection({
  testResult,
  streamUrl,
  metadata,
  metadataLoading = false,
  className,
  onPreviewStart,
  onPreviewStop,
  compact = false
}: StreamPreviewSectionProps) {
  // Only show preview section if stream test was successful
  const showPreview = testResult?.success && streamUrl;

  if (!showPreview) {
    return null;
  }

  return (
    <Card
      title={
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span>Akış Önizleme ve Metadata</span>
        </div>
      }
      className={cn(
        'transition-all duration-300',
        'bg-gradient-to-br from-dark-surface-primary to-dark-surface-secondary/30',
        className
      )}
      compact={compact}
    >
      <div className="space-y-6">
        {/* Success Message */}
        <div className="flex items-center gap-3 p-3 bg-green-900/20 border border-green-800/50 rounded-lg">
          <svg
            className="w-5 h-5 text-green-400 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
          <div className="flex-1">
            <p className="text-green-400 text-sm font-medium">
              Akış testi başarılı
            </p>
            <p className="text-green-400/80 text-xs">
              {testResult.message}
            </p>
          </div>
          {testResult.timestamp && (
            <p className="text-green-400/60 text-xs">
              {new Date(testResult.timestamp).toLocaleTimeString('tr-TR')}
            </p>
          )}
        </div>

        {/* Audio Preview Player */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <svg
              className="w-4 h-4 text-brand-red-500"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
            <h4 className="text-sm font-semibold text-dark-text-primary uppercase tracking-wider">
              Ses Önizlemesi
            </h4>
          </div>
          <AudioPreviewPlayer
            streamUrl={streamUrl}
            onPreviewStart={onPreviewStart}
            onPreviewStop={onPreviewStop}
            compact={compact}
            className="border-0 bg-transparent p-0"
          />
        </div>

        {/* Metadata Display */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <svg
              className="w-4 h-4 text-blue-500"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M11 17h2v-6h-2v6zm1-15C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM13 9h-2V7h2v2z"/>
            </svg>
            <h4 className="text-sm font-semibold text-dark-text-primary uppercase tracking-wider">
              Stream Bilgileri
            </h4>
          </div>
          <MetadataDisplay
            metadata={metadata}
            loading={metadataLoading}
            className="border-0 bg-transparent p-0"
          />
        </div>

        {/* Technical Details Footer */}
        {testResult.details && (
          <div className="pt-4 border-t border-dark-border-primary/30">
            <div className="flex items-center justify-between text-xs text-dark-text-secondary">
              <div className="flex items-center gap-4">
                {testResult.details.responseTime && (
                  <span>
                    Yanıt süresi: {testResult.details.responseTime}ms
                  </span>
                )}
                {testResult.details.statusCode && (
                  <span>
                    Durum: {testResult.details.statusCode}
                  </span>
                )}
              </div>
              <span>
                {new Date(testResult.timestamp).toLocaleDateString('tr-TR')}
              </span>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}