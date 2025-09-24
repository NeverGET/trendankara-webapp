'use client';

import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { SlidingNumber } from '@/components/ui/sliding-number';
import { FiRadio, FiUsers, FiTrendingUp } from 'react-icons/fi';

interface RadioStatsCardProps {
  currentListeners: number;
  peakListeners: number;
  streamStatus: boolean;
  className?: string;
}

export function RadioStatsCard({
  currentListeners: initialCurrent,
  peakListeners: initialPeak,
  streamStatus: initialStatus,
  className
}: RadioStatsCardProps) {
  const [currentListeners, setCurrentListeners] = useState(initialCurrent);
  const [peakListeners, setPeakListeners] = useState(initialPeak);
  const [streamStatus, setStreamStatus] = useState(initialStatus);
  const [isLoading, setIsLoading] = useState(false);

  // Update state when props change
  useEffect(() => {
    setCurrentListeners(initialCurrent);
    setPeakListeners(initialPeak);
    setStreamStatus(initialStatus);
  }, [initialCurrent, initialPeak, initialStatus]);

  // Fetch initial stats on mount
  useEffect(() => {
    const fetchInitialStats = async () => {
      try {
        const response = await fetch('/api/radio/stats');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            setCurrentListeners(data.data.currentListeners);
            setPeakListeners(data.data.peakListeners);
            setStreamStatus(data.data.streamStatus);
            console.log('Initial radio stats loaded:', data.data);
          }
        }
      } catch (error) {
        console.error('Failed to fetch initial radio stats:', error);
      }
    };

    // Only fetch if initial values are 0
    if (initialCurrent === 0 && initialPeak === 0) {
      fetchInitialStats();
    }
  }, [initialCurrent, initialPeak]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/radio/stats');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            setCurrentListeners(data.data.currentListeners);
            setPeakListeners(data.data.peakListeners);
            setStreamStatus(data.data.streamStatus);
            console.log('Periodic radio stats update:', data.data);
          }
        }
      } catch (error) {
        console.error('Failed to fetch radio stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const interval = setInterval(fetchStats, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, []);
  const percentage = peakListeners > 0
    ? Math.round((currentListeners / peakListeners) * 100)
    : 0;

  return (
    <Card className={cn(
      'p-6 bg-gradient-to-br from-brand-red-900/20 to-dark-surface-primary',
      'border-brand-red-900/30',
      'relative overflow-hidden',
      className
    )}>
      {/* Animated background pulse */}
      {streamStatus && (
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0 bg-gradient-to-r from-brand-red-600/20 to-transparent animate-pulse" />
        </div>
      )}

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-brand-red-600 to-brand-red-700 rounded-xl text-white shadow-lg shadow-brand-red-900/50">
              <FiRadio className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-dark-text-primary flex items-center gap-2">
                Radyo İstatistikleri
                {isLoading && (
                  <svg className="animate-spin h-4 w-4 text-brand-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                )}
              </h3>
              <Badge
                variant={streamStatus ? 'success' : 'error'}
                size="sm"
                pill
                animated={streamStatus}
              >
                {streamStatus ? 'Canlı Yayında' : 'Yayın Yok'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Current Listeners */}
          <div className="bg-dark-surface-secondary/50 rounded-xl p-4 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-2">
              <FiUsers className="w-4 h-4 text-brand-red-500" />
              <span className="text-sm text-dark-text-secondary">Şu An Dinleyen</span>
            </div>
            <div className="flex items-baseline gap-2">
              <SlidingNumber
                from={0}
                to={currentListeners}
                duration={1.2}
                startOnView={false}
                repeat={false}
                digitHeight={36}
                className="text-3xl font-bold text-red-500"
              />
              <span className="text-sm text-dark-text-secondary">kişi</span>
            </div>
          </div>

          {/* Peak Listeners */}
          <div className="bg-dark-surface-secondary/50 rounded-xl p-4 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-2">
              <FiTrendingUp className="w-4 h-4 text-purple-500" />
              <span className="text-sm text-dark-text-secondary">Günün Zirvesi</span>
            </div>
            <div className="flex items-baseline gap-2">
              <SlidingNumber
                from={0}
                to={peakListeners}
                duration={1.5}
                startOnView={false}
                repeat={false}
                digitHeight={36}
                className="text-3xl font-bold text-purple-500"
              />
              <span className="text-sm text-dark-text-secondary">kişi</span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-dark-text-secondary">Doluluk Oranı</span>
            <span className="text-xs font-medium text-brand-red-500">{percentage}%</span>
          </div>
          <div className="w-full h-2 bg-dark-surface-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-brand-red-600 to-brand-red-500 rounded-full transition-all duration-500"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      </div>
    </Card>
  );
}