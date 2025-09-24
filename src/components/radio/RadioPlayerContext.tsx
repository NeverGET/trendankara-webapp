'use client';

import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
// Client-side component - use API calls instead of direct database imports
import { createRadioEventManager, RADIO_EVENT_NAMES } from '@/lib/utils/radioEvents';
import type { StreamConfigurationData } from '@/types/radioSettings';

interface RadioPlayerContextValue {
  // Player state
  isPlaying: boolean;
  isLoading: boolean;
  volume: number;
  currentSong: string;
  currentListeners: number;
  bitrate: string;
  streamHealth: number;

  // Connection state
  connectionStatus: 'connected' | 'connecting' | 'disconnected';
  reconnectAttempts: number;
  lastError: Error | null;

  // Actions
  play: () => Promise<void>;
  pause: () => void;
  setVolume: (volume: number) => void;
  resetPlayer: () => void;  // Nuclear reset for iOS
  reloadConfiguration: () => Promise<void>; // Real-time sync for radio settings

  // iOS specific
  isIOS: boolean;
  audioContext?: AudioContext;
}

const RadioPlayerContext = createContext<RadioPlayerContextValue | undefined>(undefined);

interface RadioPlayerProviderProps {
  children: React.ReactNode;
  streamUrl?: string;
  metadataUrl?: string;
}

export function RadioPlayerProvider({
  children,
  streamUrl: initialStreamUrl = 'https://radyo.yayin.com.tr:5132/stream',
  metadataUrl: initialMetadataUrl = 'https://radyo.yayin.com.tr:5132/'
}: RadioPlayerProviderProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Dynamic URLs for real-time configuration updates
  const [streamUrl, setStreamUrl] = useState(initialStreamUrl);
  const [metadataUrl, setMetadataUrl] = useState(initialMetadataUrl);
  const [fallbackUrl, setFallbackUrl] = useState<string | null>(null);
  const [lastWorkingUrl, setLastWorkingUrl] = useState<string | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [volume, setVolumeState] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('radioVolume');
      return saved ? parseFloat(saved) : 0.7;
    }
    return 0.7;
  });
  const [currentSong, setCurrentSong] = useState('Now Playing info goes here');
  const [currentListeners, setCurrentListeners] = useState(0);
  const [bitrate, setBitrate] = useState('128');
  const [streamHealth, setStreamHealth] = useState(100);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('disconnected');
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [lastError, setLastError] = useState<Error | null>(null);

  // iOS detection
  const isIOS = typeof window !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);

  // Initialize audio element
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const audio = new Audio();
    audio.preload = 'none';
    audio.crossOrigin = 'anonymous';
    audioRef.current = audio;

    // Set initial volume
    audio.volume = volume;

    // Audio event handlers
    const handleCanPlay = () => {
      setIsLoading(false);
      setConnectionStatus('connected');
      setStreamHealth(100);
      setReconnectAttempts(0);
    };

    const handleError = (e: Event) => {
      console.error('Audio error:', e);
      setLastError(new Error('Stream error'));
      setConnectionStatus('disconnected');
      setIsLoading(false);
      setIsPlaying(false);

      // Attempt reconnection with exponential backoff
      if (reconnectAttempts < 5) {
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
        reconnectTimeoutRef.current = setTimeout(() => {
          if (isPlaying) {
            play();
          }
        }, delay);
        setReconnectAttempts(prev => prev + 1);
      }
    };

    const handleWaiting = () => {
      setIsLoading(true);
      setConnectionStatus('connecting');
    };

    const handlePlaying = () => {
      setIsLoading(false);
      setIsPlaying(true);
      setConnectionStatus('connected');
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('error', handleError);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('playing', handlePlaying);
    audio.addEventListener('pause', handlePause);

    return () => {
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('playing', handlePlaying);
      audio.removeEventListener('pause', handlePause);

      audio.pause();
      audio.src = '';
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Nuclear reset for iOS
  const resetPlayer = useCallback(() => {
    if (!audioRef.current) return;

    // Destroy everything
    audioRef.current.pause();
    audioRef.current.src = '';
    audioRef.current.load();

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    // Wait a moment
    setTimeout(() => {
      // Recreate with cache-busted URL
      const audio = new Audio();
      audio.preload = 'none';
      audio.crossOrigin = 'anonymous';
      audio.volume = volume;
      audioRef.current = audio;

      if (isIOS) {
        // Create new AudioContext for iOS
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        audioContextRef.current = new AudioContext();
      }
    }, 100);
  }, [volume, isIOS]);

  const play = useCallback(async () => {
    if (!audioRef.current) return;

    try {
      setIsLoading(true);
      setConnectionStatus('connecting');
      setLastError(null);

      // Try primary stream URL first with iOS-compatible cache-busting
      let urlToTry = streamUrl;
      let isFallback = false;

      const attemptPlay = async (url: string, fallback: boolean = false) => {
        console.log(`[RadioPlayer] Attempting to play ${fallback ? 'fallback ' : ''}stream:`, url);

        const cacheBustedUrl = isIOS
          ? `${url}?t=${Date.now()}&r=${Math.random().toString(36).substring(7)}&ios=1${fallback ? '&fallback=1' : ''}`
          : `${url}?t=${Date.now()}${fallback ? '&fallback=1' : ''}`;

        if (audioRef.current) {
          audioRef.current.src = cacheBustedUrl;
          audioRef.current.load();
          await audioRef.current.play();

          if (!fallback) {
            setLastWorkingUrl(url);
          }
          console.log(`[RadioPlayer] Successfully started playing ${fallback ? 'fallback ' : ''}stream`);
        }
      };

      try {
        await attemptPlay(urlToTry, isFallback);
      } catch (primaryError) {
        console.warn('[RadioPlayer] Primary stream failed, trying fallback options:', primaryError);
        setLastError(new Error(`Primary stream failed: ${primaryError instanceof Error ? primaryError.message : 'Unknown error'}`));

        // Try last working URL if available and different from current
        if (lastWorkingUrl && lastWorkingUrl !== urlToTry) {
          try {
            console.log('[RadioPlayer] Trying last working URL:', lastWorkingUrl);
            await attemptPlay(lastWorkingUrl, true);
            urlToTry = lastWorkingUrl;
            isFallback = true;
          } catch (lastWorkingError) {
            console.warn('[RadioPlayer] Last working URL failed:', lastWorkingError);
          }
        }

        // Try environment fallback URL if available and different
        if (!isFallback && fallbackUrl && fallbackUrl !== urlToTry && fallbackUrl !== lastWorkingUrl) {
          try {
            console.log('[RadioPlayer] Trying environment fallback URL:', fallbackUrl);
            await attemptPlay(fallbackUrl, true);
            urlToTry = fallbackUrl;
            isFallback = true;
          } catch (fallbackError) {
            console.warn('[RadioPlayer] Environment fallback URL failed:', fallbackError);
          }
        }

        // If all attempts failed, throw the original error
        if (!isFallback) {
          throw primaryError;
        }
      }

      // Update streamUrl to reflect what we're actually playing
      if (isFallback && urlToTry !== streamUrl) {
        setStreamUrl(urlToTry);
      }

    } catch (error) {
      console.error('[RadioPlayer] All play attempts failed:', error);
      setLastError(new Error(`Playback failed: ${error instanceof Error ? error.message : 'Unknown error'}`));
      setIsLoading(false);
      setConnectionStatus('disconnected');
      setIsPlaying(false);
    }
  }, [streamUrl, lastWorkingUrl, fallbackUrl, isIOS]);

  const pause = useCallback(() => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    setIsPlaying(false);
  }, []);

  const setVolume = useCallback((newVolume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    setVolumeState(clampedVolume);
    if (audioRef.current) {
      audioRef.current.volume = clampedVolume;
    }
    localStorage.setItem('radioVolume', clampedVolume.toString());
  }, []);

  // Helper function to perform fallback connections
  const performFallbackConnection = useCallback(async (fallbackStreamUrl: string) => {
    if (!audioRef.current) return;

    console.log('[RadioPlayer] Attempting fallback connection to:', fallbackStreamUrl);

    try {
      setConnectionStatus('connecting');
      setIsLoading(true);

      const cacheBustedUrl = isIOS
        ? `${fallbackStreamUrl}?t=${Date.now()}&r=${Math.random().toString(36).substring(7)}&fallback=1`
        : `${fallbackStreamUrl}?t=${Date.now()}&fallback=1`;

      audioRef.current.src = cacheBustedUrl;
      audioRef.current.load();
      await audioRef.current.play();

      // Update streamUrl to reflect successful fallback
      setStreamUrl(fallbackStreamUrl);
      setLastWorkingUrl(fallbackStreamUrl);

      console.log('[RadioPlayer] Fallback connection successful');
    } catch (error) {
      console.error('[RadioPlayer] Fallback connection failed:', error);
      throw error;
    }
  }, [isIOS]);

  // Helper function to perform seamless stream URL transitions
  const performSeamlessTransition = useCallback(async (newUrl: string) => {
    if (!audioRef.current) return;

    const previousUrl = streamUrl;
    console.log('[RadioPlayer] Starting seamless transition from', previousUrl, 'to', newUrl);

    try {
      setConnectionStatus('connecting');
      setIsLoading(true);
      setLastError(null);

      // Store current playback state
      const wasPlaying = !audioRef.current.paused;

      // Pause current stream gracefully
      audioRef.current.pause();

      // Wait a moment for cleanup
      await new Promise(resolve => setTimeout(resolve, 500));

      // Apply iOS-compatible cache-busting for URL transitions
      const cacheBustedUrl = isIOS
        ? `${newUrl}?t=${Date.now()}&r=${Math.random().toString(36).substring(7)}&ios=1`
        : `${newUrl}?t=${Date.now()}`;

      console.log('[RadioPlayer] Transitioning to cache-busted URL:', cacheBustedUrl);

      if (audioRef.current) {
        audioRef.current.src = cacheBustedUrl;
        audioRef.current.load();

        if (wasPlaying) {
          await audioRef.current.play();
          setLastWorkingUrl(newUrl);
          console.log('[RadioPlayer] Seamless transition successful');
        }
      }

    } catch (error) {
      console.error('[RadioPlayer] Seamless transition failed:', error);
      setLastError(new Error(`Stream transition failed: ${error instanceof Error ? error.message : 'Unknown error'}`));
      setConnectionStatus('disconnected');
      setIsLoading(false);
      setIsPlaying(false);

      // Fall back to previous working URL if available
      if (lastWorkingUrl && lastWorkingUrl !== newUrl && lastWorkingUrl !== previousUrl) {
        console.log('[RadioPlayer] Attempting fallback to last working URL:', lastWorkingUrl);
        try {
          await performFallbackConnection(lastWorkingUrl);
        } catch (fallbackError) {
          console.error('[RadioPlayer] Fallback to last working URL failed:', fallbackError);
        }
      }
      // Or fall back to environment fallback URL
      else if (fallbackUrl && fallbackUrl !== newUrl && fallbackUrl !== previousUrl) {
        console.log('[RadioPlayer] Attempting fallback to environment URL:', fallbackUrl);
        try {
          await performFallbackConnection(fallbackUrl);
        } catch (fallbackError) {
          console.error('[RadioPlayer] Fallback URL connection failed:', fallbackError);
        }
      }
    }
  }, [streamUrl, isIOS, lastWorkingUrl, fallbackUrl, performFallbackConnection]);

  // Enhanced method to reload configuration from database with fallback support
  const reloadConfiguration = useCallback(async () => {
    try {
      console.log('[RadioPlayer] Reloading configuration from database...');

      // Load active settings from existing API
      const response = await fetch('/api/radio');
      let newStreamUrl = initialStreamUrl;
      let newMetadataUrl = initialMetadataUrl;

      if (response.ok) {
        const radioConfig = await response.json();
        if (radioConfig.success && radioConfig.data) {
          const settings = radioConfig.data;
          newStreamUrl = settings.stream_url || initialStreamUrl;
          newMetadataUrl = settings.metadata_url || initialMetadataUrl;
          console.log('[RadioPlayer] Loaded settings from API:', {
            streamUrl: newStreamUrl,
            metadataUrl: newMetadataUrl,
            stationName: settings.station_name,
            isFallback: settings.is_fallback_url
          });
        } else {
          console.warn('[RadioPlayer] No active settings found in API response, using defaults');
        }
      } else {
        console.warn('[RadioPlayer] Failed to load settings from API, using defaults');
      }

      // Load fallback URL from environment via API
      try {
        const fallbackResponse = await fetch('/api/radio/fallback');
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          const fallbackStreamUrl = fallbackData.fallbackUrl;
          if (fallbackStreamUrl && fallbackStreamUrl !== newStreamUrl) {
            setFallbackUrl(fallbackStreamUrl);
            console.log('[RadioPlayer] Loaded fallback URL from API:', fallbackStreamUrl);
          }
        }
      } catch (fallbackError) {
        console.warn('[RadioPlayer] Failed to load fallback URL from API:', fallbackError);
      }

      // Check if URLs have changed
      const urlsChanged = newStreamUrl !== streamUrl || newMetadataUrl !== metadataUrl;

      if (urlsChanged) {
        console.log('[RadioPlayer] URLs changed, updating configuration:', {
          previousStreamUrl: streamUrl,
          newStreamUrl,
          previousMetadataUrl: metadataUrl,
          newMetadataUrl
        });

        setStreamUrl(newStreamUrl);
        setMetadataUrl(newMetadataUrl);

        // If currently playing, seamlessly transition to new stream URL
        if (isPlaying && audioRef.current && newStreamUrl !== streamUrl) {
          console.log('[RadioPlayer] Player is active, performing seamless transition...');
          await performSeamlessTransition(newStreamUrl);
        }
      } else {
        console.log('[RadioPlayer] Configuration unchanged');
      }

    } catch (error) {
      console.error('[RadioPlayer] Error reloading radio configuration:', error);
      setLastError(new Error(`Configuration reload failed: ${error instanceof Error ? error.message : 'Unknown error'}`));

      // If reload fails and we have a fallback URL, try to use it
      if (fallbackUrl && fallbackUrl !== streamUrl) {
        console.log('[RadioPlayer] Attempting to use fallback URL due to reload failure...');
        try {
          await performSeamlessTransition(fallbackUrl);
        } catch (fallbackError) {
          console.error('[RadioPlayer] Fallback URL also failed:', fallbackError);
        }
      }
    }
  }, [streamUrl, metadataUrl, fallbackUrl, isPlaying, isIOS, initialStreamUrl, initialMetadataUrl, performSeamlessTransition]);

  // Fetch now playing text periodically
  useEffect(() => {
    const fetchNowPlaying = async () => {
      try {
        const response = await fetch('/api/radio/nowplaying');
        if (response.ok) {
          const data = await response.json();
          setCurrentSong(data.nowPlaying);
        }
      } catch (error) {
        // Ignore errors
      }
    };

    fetchNowPlaying();
    const interval = setInterval(fetchNowPlaying, 10000); // Every 10 seconds

    return () => clearInterval(interval);
  }, []);

  // Enhanced event system for real-time configuration updates
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const eventManager = createRadioEventManager('RadioPlayerContext');

    // Listen for general settings updates
    eventManager.onSettingsUpdate((event) => {
      console.log('[RadioPlayer] Settings update event received:', event.detail.changedFields);
      reloadConfiguration();
    });

    // Listen for specific stream URL changes for immediate response
    eventManager.onStreamUrlChange((event) => {
      const { streamUrl: newStreamUrl, previousStreamUrl, requiresReconnection } = event.detail;
      console.log('[RadioPlayer] Stream URL change event received:', {
        newUrl: newStreamUrl,
        previousUrl: previousStreamUrl,
        requiresReconnection
      });

      if (requiresReconnection && isPlaying && audioRef.current) {
        performSeamlessTransition(newStreamUrl).catch(error => {
          console.error('[RadioPlayer] Failed to handle stream URL change event:', error);
        });
      }
    });

    // Listen for configuration reload requirements
    eventManager.onConfigurationReload((event) => {
      const { reason, priority } = event.detail;
      console.log('[RadioPlayer] Configuration reload requested:', { reason, priority });

      if (priority === 'high') {
        // High priority reloads should happen immediately
        reloadConfiguration();
      } else {
        // Normal/low priority reloads can be debounced
        setTimeout(() => reloadConfiguration(), 1000);
      }
    });

    // Listen for legacy events for backward compatibility
    const handleLegacySettingsUpdate = () => {
      console.log('[RadioPlayer] Legacy settings update event received');
      reloadConfiguration();
    };

    window.addEventListener('radioSettingsUpdated', handleLegacySettingsUpdate);

    return () => {
      eventManager.cleanup();
      window.removeEventListener('radioSettingsUpdated', handleLegacySettingsUpdate);
    };
  }, [reloadConfiguration, performSeamlessTransition, isPlaying]);

  // Load initial configuration and fallback URL on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Load initial configuration from database
    const loadInitialConfiguration = async () => {
      try {
        console.log('[RadioPlayer] Loading initial configuration...');
        await reloadConfiguration();
      } catch (error) {
        console.error('[RadioPlayer] Failed to load initial configuration:', error);
      }
    };

    // Small delay to ensure component is fully mounted
    const timeoutId = setTimeout(loadInitialConfiguration, 100);

    return () => clearTimeout(timeoutId);
  }, [reloadConfiguration]);

  const value: RadioPlayerContextValue = {
    isPlaying,
    isLoading,
    volume,
    currentSong,
    currentListeners,
    bitrate,
    streamHealth,
    connectionStatus,
    reconnectAttempts,
    lastError,
    play,
    pause,
    setVolume,
    resetPlayer,
    reloadConfiguration,
    isIOS,
    audioContext: audioContextRef.current || undefined
  };

  return (
    <RadioPlayerContext.Provider value={value}>
      {children}
    </RadioPlayerContext.Provider>
  );
}

export function useRadioPlayer() {
  const context = useContext(RadioPlayerContext);
  if (!context) {
    throw new Error('useRadioPlayer must be used within RadioPlayerProvider');
  }
  return context;
}