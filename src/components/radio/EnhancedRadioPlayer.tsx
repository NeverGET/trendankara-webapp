'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'motion/react';
import { useRadioPlayer } from '@/hooks/useRadioPlayer';

interface SoundBarProps {
  isPlaying: boolean;
  index: number;
}

function SoundBar({ isPlaying, index }: SoundBarProps) {
  const [height, setHeight] = useState(20);

  useEffect(() => {
    if (!isPlaying) {
      setHeight(20);
      return;
    }

    // Initial random height
    setHeight(Math.random() * 80 + 20);

    // Different interval for each bar to create organic movement
    const baseInterval = 200;
    const interval = setInterval(() => {
      // Random height between 20% and 100%
      setHeight(Math.random() * 80 + 20);
    }, baseInterval + (Math.random() * 100) - 50 + index * 30);

    return () => clearInterval(interval);
  }, [isPlaying, index]);

  return (
    <motion.div
      className="w-1 bg-red-600 rounded-full"
      animate={{
        height: isPlaying ? `${height}%` : '20%',
        opacity: isPlaying ? 1 : 0
      }}
      transition={{
        height: { duration: 0.2, ease: "easeInOut" },
        opacity: { duration: 0.3 }
      }}
      style={{ minHeight: '20%' }}
    />
  );
}

export function EnhancedRadioPlayer() {
  const {
    isPlaying,
    isLoading,
    volume,
    currentSong,
    play,
    pause,
    setVolume
  } = useRadioPlayer();

  const [isMuted, setIsMuted] = useState(false);
  const previousVolume = React.useRef(volume);

  // On mobile, always use full volume
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (isMobile && volume < 1) {
      setVolume(1);
    }
  }, [isMobile, setVolume, volume]);

  const handlePlayPause = async () => {
    if (isPlaying) {
      pause();
    } else {
      await play();
    }
  };

  const handleMute = () => {
    if (isMuted) {
      setVolume(previousVolume.current);
      setIsMuted(false);
    } else {
      previousVolume.current = volume;
      setVolume(0);
      setIsMuted(true);
    }
  };

  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="fixed bottom-0 left-0 right-0 z-50 bg-dark-bg-primary/95 backdrop-blur-lg border-t border-dark-border-primary"
    >
      <div className="container mx-auto px-2 md:px-4">
        <div className="flex items-center justify-between h-16 md:h-20 gap-2 md:gap-4">
          {/* Station Name - Desktop Only */}
          <div className="hidden md:flex items-center gap-3 min-w-[200px]">
            <div className="w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center bg-black">
              <Image
                src="/TrendAnkara-Logo.png"
                alt="Trend Ankara Logo"
                width={40}
                height={40}
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h3 className="text-sm font-bold text-dark-text-primary">Trend Ankara</h3>
              <p className="text-xs text-dark-text-secondary">24/7 Canlı Yayın</p>
            </div>
          </div>

          {/* Mobile Layout */}
          {isMobile ? (
            <>
              {/* Now Playing - Mobile */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {/* Sound Bars */}
                  <div className="flex items-center gap-0.5 h-6 w-5">
                    {[0, 1, 2, 3].map((i) => (
                      <SoundBar key={i} isPlaying={isPlaying} index={i} />
                    ))}
                  </div>
                  {/* Now Playing Text */}
                  <div className={`text-xs font-medium truncate ${
                    isPlaying ? 'text-red-100' : 'text-rose-100'
                  }`}>
                    {isPlaying ? currentSong : 'Radyo çalınmıyor'}
                  </div>
                </div>
              </div>

              {/* Play/Pause Button - Mobile Centered */}
              <motion.button
                onClick={handlePlayPause}
                className="relative w-16 h-16 rounded-full bg-brand-red-600 flex items-center justify-center text-white mx-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.2 }}
                disabled={isLoading}
              >
                <AnimatePresence mode="wait">
                  {isLoading ? (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute"
                    >
                      <svg className="animate-spin h-7 w-7" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    </motion.div>
                  ) : isPlaying ? (
                    <motion.svg
                      key="pause"
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0, rotate: 180 }}
                      transition={{ duration: 0.3 }}
                      className="w-7 h-7"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <rect x="6" y="4" width="4" height="16" rx="1" />
                      <rect x="14" y="4" width="4" height="16" rx="1" />
                    </motion.svg>
                  ) : (
                    <motion.svg
                      key="play"
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0, rotate: 180 }}
                      transition={{ duration: 0.3 }}
                      className="w-7 h-7 ml-0.5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M8 5v14l11-7z" />
                    </motion.svg>
                  )}
                </AnimatePresence>
              </motion.button>

              {/* Mute Button - Mobile */}
              <motion.button
                onClick={handleMute}
                className="relative w-12 h-12 rounded-full bg-dark-surface-secondary flex items-center justify-center text-dark-text-secondary hover:text-dark-text-primary"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <AnimatePresence mode="wait">
                  {isMuted ? (
                    <motion.svg
                      key="muted"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      transition={{ duration: 0.2 }}
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.796 8.796 0 0021 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06a8.99 8.99 0 003.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
                    </motion.svg>
                  ) : (
                    <motion.svg
                      key="unmuted"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      transition={{ duration: 0.2 }}
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                    </motion.svg>
                  )}
                </AnimatePresence>
              </motion.button>
            </>
          ) : (
            /* Desktop Layout */
            <>
              {/* Simple Now Playing Badge - Desktop */}
              <div className="flex-1 max-w-2xl">
                <div className="flex items-center justify-center gap-3">
                  {/* Sound Bars */}
                  <div className="flex items-center gap-1 h-8 w-[28px]">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <SoundBar key={i} isPlaying={isPlaying} index={i} />
                    ))}
                  </div>

                  {/* Now Playing Badge */}
                  <div className={`px-4 py-2 rounded-full font-medium text-sm truncate shadow-lg ${
                    isPlaying
                      ? 'bg-red-600 text-red-100 shadow-red-600/30'
                      : 'bg-rose-950 text-rose-100 shadow-rose-950/20'
                  }`}>
                    {isPlaying ? currentSong : 'Radyo çalınmıyor'}
                  </div>
                </div>
              </div>

              {/* Controls - Desktop */}
              <div className="flex items-center gap-2">
                {/* Play/Pause Button - Desktop */}
                <motion.button
                  onClick={handlePlayPause}
                  className="relative w-14 h-14 rounded-full bg-brand-red-600 flex items-center justify-center text-white"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  disabled={isLoading}
                >
              <AnimatePresence mode="wait">
                {isLoading ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute"
                  >
                    <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  </motion.div>
                ) : isPlaying ? (
                  <motion.svg
                    key="pause"
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, rotate: 180 }}
                    transition={{ duration: 0.3 }}
                    className="w-6 h-6"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <rect x="6" y="4" width="4" height="16" rx="1" />
                    <rect x="14" y="4" width="4" height="16" rx="1" />
                  </motion.svg>
                ) : (
                  <motion.svg
                    key="play"
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, rotate: 180 }}
                    transition={{ duration: 0.3 }}
                    className="w-6 h-6 ml-0.5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M8 5v14l11-7z" />
                  </motion.svg>
                )}
                  </AnimatePresence>
                </motion.button>

                {/* Mute Button - Desktop */}
                <motion.button
                  onClick={handleMute}
                  className="relative w-12 h-12 rounded-full bg-dark-surface-secondary flex items-center justify-center text-dark-text-secondary hover:text-dark-text-primary"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
              <AnimatePresence mode="wait">
                {isMuted ? (
                  <motion.svg
                    key="muted"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    transition={{ duration: 0.2 }}
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.796 8.796 0 0021 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06a8.99 8.99 0 003.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
                  </motion.svg>
                ) : (
                  <motion.svg
                    key="unmuted"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    transition={{ duration: 0.2 }}
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                  </motion.svg>
                )}
                  </AnimatePresence>
                </motion.button>

                {/* Volume Slider - Desktop only */}
                <div className="flex items-center gap-2">
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  const newVolume = parseFloat(e.target.value);
                  setVolume(newVolume);
                  if (newVolume > 0 && isMuted) {
                    setIsMuted(false);
                  }
                }}
                className="w-24 h-2 bg-rose-950 rounded-lg appearance-none cursor-pointer slider [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-rose-500 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:hover:bg-rose-400 [&::-webkit-slider-thumb]:transition-colors [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:bg-rose-500 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:hover:bg-rose-400 [&::-moz-range-thumb]:transition-colors"
                aria-label="Ses seviyesi"
              />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}