import React from 'react';
import { cn } from '@/lib/utils';
import { ScrollContainer } from './ScrollContainer';

/**
 * ButtonGroup component that groups buttons logically and prevents individual button shrinking
 * below minimum size. Provides horizontal scrolling when space is limited.
 *
 * @example
 * ```tsx
 * <ButtonGroup>
 *   <Button>Action 1</Button>
 *   <Button>Action 2</Button>
 *   <Button>Action 3</Button>
 * </ButtonGroup>
 * ```
 *
 * @example With custom gap and orientation
 * ```tsx
 * <ButtonGroup gap="large" orientation="vertical" allowOverflow={false}>
 *   <Button>Save</Button>
 *   <Button variant="secondary">Cancel</Button>
 * </ButtonGroup>
 * ```
 */

interface ButtonGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  gap?: 'none' | 'small' | 'medium' | 'large';
  orientation?: 'horizontal' | 'vertical';
  allowOverflow?: boolean;
  showScrollFade?: boolean;
  fadeSize?: 'small' | 'medium' | 'large';
  className?: string;
}

const gapClasses = {
  none: 'gap-0',
  small: 'gap-2',
  medium: 'gap-3',
  large: 'gap-4'
};

export function ButtonGroup({
  children,
  gap = 'medium',
  orientation = 'horizontal',
  allowOverflow = true,
  showScrollFade = true,
  fadeSize = 'medium',
  className,
  ...props
}: ButtonGroupProps) {
  const isHorizontal = orientation === 'horizontal';

  // Base flex classes for button grouping
  const flexClasses = cn(
    'flex',
    isHorizontal ? 'flex-row' : 'flex-col',
    gapClasses[gap]
  );

  // Content wrapper that applies flex-shrink-0 to all buttons
  const contentClasses = cn(
    flexClasses,
    // Prevent button shrinking below minimum size (Requirement 5.2, 5.5)
    '[&>button]:flex-shrink-0',
    '[&>*]:flex-shrink-0', // Also apply to any direct children that might wrap buttons
    className
  );

  // If overflow is allowed and orientation is horizontal, use ScrollContainer
  if (allowOverflow && isHorizontal) {
    return (
      <ScrollContainer
        showFade={showScrollFade}
        fadeSize={fadeSize}
        className={className}
        {...props}
      >
        <div className={contentClasses}>
          {children}
        </div>
      </ScrollContainer>
    );
  }

  // For vertical orientation or when overflow is disabled, use regular container
  return (
    <div
      className={cn(
        contentClasses,
        // Handle overflow behavior when not using ScrollContainer
        !allowOverflow && isHorizontal && 'overflow-hidden',
        !allowOverflow && !isHorizontal && 'overflow-y-auto'
      )}
      {...props}
    >
      {children}
    </div>
  );
}