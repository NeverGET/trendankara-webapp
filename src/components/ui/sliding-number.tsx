'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, MotionValue, useInView, useSpring, useTransform } from 'framer-motion';
import { cn } from '@/lib/utils';

function Digit({
  place,
  value,
  digitHeight,
  duration,
}: {
  place: number;
  value: number;
  digitHeight: number;
  duration: number;
}) {
  const valueRoundedToPlace = Math.floor(value / place);
  const animatedValue = useSpring(valueRoundedToPlace, {
    duration: duration * 1000, // Convert to milliseconds
  });

  useEffect(() => {
    animatedValue.set(valueRoundedToPlace);
  }, [animatedValue, valueRoundedToPlace]);

  return (
    <div style={{ height: digitHeight }} className="relative w-[1ch] tabular-nums overflow-hidden">
      {Array.from({ length: 10 }, (_, i) => (
        <Number key={i} mv={animatedValue} number={i} digitHeight={digitHeight} />
      ))}
    </div>
  );
}

function Number({ mv, number, digitHeight }: { mv: MotionValue<number>; number: number; digitHeight: number }) {
  const y = useTransform(mv, (latest: number) => {
    const placeValue = latest % 10;
    const offset = (10 + number - placeValue) % 10;

    let memo = offset * digitHeight;

    if (offset > 5) {
      memo -= 10 * digitHeight;
    }

    return memo;
  });

  return (
    <motion.span style={{ y }} className="absolute inset-0 flex items-center justify-center">
      {number}
    </motion.span>
  );
}

interface SlidingNumberProps {
  from: number;
  to: number;
  duration?: number;
  delay?: number;
  startOnView?: boolean;
  digitHeight?: number;
  className?: string;
  onComplete?: () => void;
  repeat?: boolean;
}

export function SlidingNumber({
  from,
  to,
  duration = 1,
  delay = 0,
  startOnView = false,
  digitHeight = 40,
  className,
  onComplete,
  repeat = false,
}: SlidingNumberProps) {
  const [value, setValue] = useState(from);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: !repeat });
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    if (startOnView && !isInView) return;
    if (startOnView && hasAnimated && !repeat) return;

    const timer = setTimeout(() => {
      setValue(to);
      setHasAnimated(true);

      // Call onComplete after animation duration
      if (onComplete) {
        setTimeout(onComplete, duration * 1000);
      }
    }, delay * 1000);

    return () => clearTimeout(timer);
  }, [to, delay, duration, startOnView, isInView, hasAnimated, repeat, onComplete]);

  // Reset animation if repeat is enabled and component comes back into view
  useEffect(() => {
    if (repeat && isInView && hasAnimated) {
      setValue(from);
      setHasAnimated(false);
    }
  }, [isInView, repeat, from, hasAnimated]);

  const numDigits = Math.max(
    String(Math.abs(from)).length,
    String(Math.abs(to)).length
  );

  return (
    <div
      ref={ref}
      className={cn(
        "flex items-center justify-center font-mono",
        className
      )}
      style={{ height: digitHeight }}
    >
      {value < 0 && (
        <span className="tabular-nums">-</span>
      )}

      {Array.from({ length: numDigits }, (_, i) => {
        const place = Math.pow(10, numDigits - 1 - i);
        return (
          <Digit
            key={i}
            place={place}
            value={Math.abs(value)}
            digitHeight={digitHeight}
            duration={duration}
          />
        );
      })}
    </div>
  );
}

export default SlidingNumber;