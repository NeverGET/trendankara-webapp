'use client';

import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';

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

      // iOS needs cache-busting to prevent stale streams
      const url = isIOS
        ? `${streamUrl}?t=${Date.now()}&r=${Math.random().toString(36).substring(7)}`
        : streamUrl;

      audioRef.current.src = url;
      audioRef.current.load();
      await audioRef.current.play();
    } catch (error) {
      console.error('Play error:', error);
      setIsLoading(false);
      setConnectionStatus('disconnected');
    }
  }, [streamUrl, isIOS]);

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

  // Method to reload configuration from API
  const reloadConfiguration = useCallback(async () => {
    try {
      const response = await fetch('/api/radio');
      if (response.ok) {
        const config = await response.json();

        const newStreamUrl = config.streamUrl || initialStreamUrl;
        const newMetadataUrl = config.metadataUrl || initialMetadataUrl;

        // Update URLs if they changed
        if (newStreamUrl !== streamUrl || newMetadataUrl !== metadataUrl) {
          setStreamUrl(newStreamUrl);
          setMetadataUrl(newMetadataUrl);

          // If currently playing, reconnect with new stream URL
          if (isPlaying && audioRef.current) {
            setConnectionStatus('connecting');
            setIsLoading(true);

            // Pause current stream
            audioRef.current.pause();

            // Wait a moment for cleanup
            setTimeout(async () => {
              try {
                // Use new URL with cache-busting for iOS
                const url = isIOS
                  ? `${newStreamUrl}?t=${Date.now()}&r=${Math.random().toString(36).substring(7)}`
                  : newStreamUrl;

                if (audioRef.current) {
                  audioRef.current.src = url;
                  audioRef.current.load();
                  await audioRef.current.play();
                }
              } catch (error) {
                console.error('Error reconnecting with new stream URL:', error);
                setConnectionStatus('disconnected');
                setIsLoading(false);
              }
            }, 500);
          }
        }
      }
    } catch (error) {
      console.error('Error reloading radio configuration:', error);
    }
  }, [streamUrl, metadataUrl, isPlaying, isIOS, initialStreamUrl, initialMetadataUrl]);

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

  // Listen for radio settings update events
  useEffect(() => {
    const handleSettingsUpdate = () => {
      reloadConfiguration();
    };

    // Listen for custom events from admin when settings are updated
    window.addEventListener('radioSettingsUpdated', handleSettingsUpdate);

    return () => {
      window.removeEventListener('radioSettingsUpdated', handleSettingsUpdate);
    };
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