import React, { useRef, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

/**
 * ScrollContainer component provides horizontal scrolling with optional fade indicators
 *
 * @example
 * ```tsx
 * <ScrollContainer showFade={true} fadeSize="medium">
 *   <div className="flex gap-4">
 *     {items.map(item => <Card key={item.id}>{item.content}</Card>)}
 *   </div>
 * </ScrollContainer>
 * ```
 */

interface ScrollContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  showFade?: boolean;
  fadeSize?: 'small' | 'medium' | 'large';
  className?: string;
}

export function ScrollContainer({
  children,
  showFade = true,
  fadeSize = 'medium',
  className,
  ...props
}: ScrollContainerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftFade, setShowLeftFade] = useState(false);
  const [showRightFade, setShowRightFade] = useState(false);

  const fadeWidthClasses = {
    small: 'w-4',
    medium: 'w-8',
    large: 'w-12'
  };

  const checkScrollPosition = () => {
    if (!scrollRef.current || !showFade) return;

    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;

    // Show left fade if scrolled past the beginning
    setShowLeftFade(scrollLeft > 0);

    // Show right fade if not scrolled to the end (with small tolerance for rounding)
    setShowRightFade(scrollLeft < scrollWidth - clientWidth - 1);
  };

  useEffect(() => {
    checkScrollPosition();
  }, [children, showFade]);

  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (!scrollElement || !showFade) return;

    scrollElement.addEventListener('scroll', checkScrollPosition);
    window.addEventListener('resize', checkScrollPosition);

    return () => {
      scrollElement.removeEventListener('scroll', checkScrollPosition);
      window.removeEventListener('resize', checkScrollPosition);
    };
  }, [showFade]);

  return (
    <div className={cn('relative', className)} {...props}>
      {/* Left fade indicator */}
      {showFade && showLeftFade && (
        <div
          className={cn(
            'absolute left-0 top-0 bottom-0 z-10 pointer-events-none',
            'bg-gradient-to-r from-dark-bg-primary to-transparent',
            fadeWidthClasses[fadeSize]
          )}
        />
      )}

      {/* Right fade indicator */}
      {showFade && showRightFade && (
        <div
          className={cn(
            'absolute right-0 top-0 bottom-0 z-10 pointer-events-none',
            'bg-gradient-to-l from-dark-bg-primary to-transparent',
            fadeWidthClasses[fadeSize]
          )}
        />
      )}

      {/* Scrollable container */}
      <div
        ref={scrollRef}
        className={cn(
          'overflow-x-auto scroll-smooth scrollbar-hidden'
        )}
      >
        {children}
      </div>
    </div>
  );
}