/**
 * Development-only Size Validation Utilities
 * Validates components for responsive design compliance and WCAG accessibility
 */

export interface TouchTargetValidation {
  element: HTMLElement;
  width: number;
  height: number;
  isCompliant: boolean;
  recommendation?: string;
}

export interface SizeValidationResult {
  touchTargets: TouchTargetValidation[];
  hardcodedValues: string[];
  warnings: string[];
  recommendations: string[];
}

// WCAG 2.1 AA minimum touch target size
const MIN_TOUCH_TARGET_SIZE = 44; // pixels
const RECOMMENDED_TOUCH_TARGET_SIZE = 48; // pixels

/**
 * Validates touch target sizes for WCAG compliance
 */
export function validateTouchTargets(container?: HTMLElement): TouchTargetValidation[] {
  if (process.env.NODE_ENV !== 'development') return [];

  const root = container || document.body;
  const interactiveElements = root.querySelectorAll(
    'button, a, input, select, textarea, [role="button"], [role="link"], [tabindex]:not([tabindex="-1"])'
  );

  const validations: TouchTargetValidation[] = [];

  interactiveElements.forEach((element) => {
    const htmlElement = element as HTMLElement;
    const rect = htmlElement.getBoundingClientRect();
    const computedStyle = window.getComputedStyle(htmlElement);

    // Get effective touch area (including padding)
    const paddingLeft = parseInt(computedStyle.paddingLeft) || 0;
    const paddingRight = parseInt(computedStyle.paddingRight) || 0;
    const paddingTop = parseInt(computedStyle.paddingTop) || 0;
    const paddingBottom = parseInt(computedStyle.paddingBottom) || 0;

    const effectiveWidth = rect.width + paddingLeft + paddingRight;
    const effectiveHeight = rect.height + paddingTop + paddingBottom;

    const isCompliant = effectiveWidth >= MIN_TOUCH_TARGET_SIZE && effectiveHeight >= MIN_TOUCH_TARGET_SIZE;

    let recommendation: string | undefined;
    if (!isCompliant) {
      if (effectiveWidth < MIN_TOUCH_TARGET_SIZE && effectiveHeight < MIN_TOUCH_TARGET_SIZE) {
        recommendation = `Increase both width and height to at least ${MIN_TOUCH_TARGET_SIZE}px`;
      } else if (effectiveWidth < MIN_TOUCH_TARGET_SIZE) {
        recommendation = `Increase width to at least ${MIN_TOUCH_TARGET_SIZE}px`;
      } else if (effectiveHeight < MIN_TOUCH_TARGET_SIZE) {
        recommendation = `Increase height to at least ${MIN_TOUCH_TARGET_SIZE}px`;
      }
    } else if (effectiveWidth < RECOMMENDED_TOUCH_TARGET_SIZE || effectiveHeight < RECOMMENDED_TOUCH_TARGET_SIZE) {
      recommendation = `Consider increasing to ${RECOMMENDED_TOUCH_TARGET_SIZE}px for better UX`;
    }

    validations.push({
      element: htmlElement,
      width: effectiveWidth,
      height: effectiveHeight,
      isCompliant,
      recommendation,
    });
  });

  return validations;
}

/**
 * Scans for hardcoded pixel values in styles
 */
export function detectHardcodedValues(container?: HTMLElement): string[] {
  if (process.env.NODE_ENV !== 'development') return [];

  const warnings: string[] = [];
  const root = container || document.body;
  const elements = root.querySelectorAll('*');

  elements.forEach((element) => {
    const htmlElement = element as HTMLElement;
    const computedStyle = window.getComputedStyle(htmlElement);

    // Properties to check for hardcoded values
    const responsiveProperties = {
      fontSize: 'text size',
      padding: 'padding',
      paddingTop: 'padding-top',
      paddingRight: 'padding-right',
      paddingBottom: 'padding-bottom',
      paddingLeft: 'padding-left',
      margin: 'margin',
      marginTop: 'margin-top',
      marginRight: 'margin-right',
      marginBottom: 'margin-bottom',
      marginLeft: 'margin-left',
      width: 'width',
      height: 'height',
      minHeight: 'min-height',
      maxWidth: 'max-width',
      gap: 'gap',
    };

    Object.entries(responsiveProperties).forEach(([prop, name]) => {
      const value = computedStyle.getPropertyValue(prop);

      if (value && value.includes('px')) {
        const pxValue = parseFloat(value);

        // Skip very small values (likely borders) and common responsive breakpoint values
        if (pxValue > 4 && ![640, 768, 1024, 1280, 1536].includes(pxValue)) {
          // Check if it's likely a hardcoded value (not divisible by common spacing units)
          if (pxValue % 4 !== 0 && pxValue % 8 !== 0) {
            warnings.push(
              `${htmlElement.tagName.toLowerCase()}${htmlElement.className ? '.' + htmlElement.className.split(' ').join('.') : ''}: ${name} has hardcoded value ${value}`
            );
          }
        }
      }
    });
  });

  return warnings;
}

/**
 * Validates spacing consistency with 8px grid system
 */
export function validateSpacingGrid(container?: HTMLElement): string[] {
  if (process.env.NODE_ENV !== 'development') return [];

  const warnings: string[] = [];
  const root = container || document.body;
  const elements = root.querySelectorAll('*');

  elements.forEach((element) => {
    const htmlElement = element as HTMLElement;
    const computedStyle = window.getComputedStyle(htmlElement);

    const spacingProperties = ['padding', 'margin', 'gap'];

    spacingProperties.forEach((prop) => {
      const value = computedStyle.getPropertyValue(prop);

      if (value && value.includes('px')) {
        const pxValue = parseFloat(value);

        // Check if value follows 8px grid system
        if (pxValue > 0 && pxValue % 8 !== 0 && pxValue % 4 !== 0) {
          warnings.push(
            `${htmlElement.tagName.toLowerCase()}: ${prop} value ${value} doesn't follow 4px/8px grid system`
          );
        }
      }
    });
  });

  return warnings;
}

/**
 * Comprehensive size validation
 */
export function validateComponentSizes(container?: HTMLElement): SizeValidationResult {
  if (process.env.NODE_ENV !== 'development') {
    return {
      touchTargets: [],
      hardcodedValues: [],
      warnings: [],
      recommendations: [],
    };
  }

  const touchTargets = validateTouchTargets(container);
  const hardcodedValues = detectHardcodedValues(container);
  const spacingWarnings = validateSpacingGrid(container);

  const warnings: string[] = [];
  const recommendations: string[] = [];

  // Analyze touch target violations
  const failedTargets = touchTargets.filter(t => !t.isCompliant);
  if (failedTargets.length > 0) {
    warnings.push(`${failedTargets.length} touch targets don't meet WCAG 2.1 AA requirements (44x44px)`);
    recommendations.push('Use min-h-[44px] min-w-[44px] or touch-optimized component variants');
  }

  // Analyze hardcoded values
  if (hardcodedValues.length > 0) {
    warnings.push(`${hardcodedValues.length} elements have hardcoded pixel values`);
    recommendations.push('Use Tailwind responsive classes (sm:, md:, lg:) instead of fixed pixel values');
  }

  // Analyze spacing violations
  if (spacingWarnings.length > 0) {
    warnings.push(`${spacingWarnings.length} spacing violations found`);
    recommendations.push('Use 4px/8px grid system: p-1 (4px), p-2 (8px), p-3 (12px), p-4 (16px), etc.');
  }

  return {
    touchTargets,
    hardcodedValues: [...hardcodedValues, ...spacingWarnings],
    warnings,
    recommendations,
  };
}

/**
 * Console reporter for development warnings
 */
export function reportSizeValidation(container?: HTMLElement): void {
  if (process.env.NODE_ENV !== 'development') return;

  const validation = validateComponentSizes(container);

  if (validation.warnings.length === 0) {
    console.log('✅ All components pass responsive design validation');
    return;
  }

  console.group('🔍 Responsive Design Validation Report');

  validation.warnings.forEach(warning => {
    console.warn('⚠️', warning);
  });

  if (validation.recommendations.length > 0) {
    console.group('💡 Recommendations');
    validation.recommendations.forEach(rec => {
      console.info('•', rec);
    });
    console.groupEnd();
  }

  // Detailed touch target report
  const failedTargets = validation.touchTargets.filter(t => !t.isCompliant);
  if (failedTargets.length > 0) {
    console.group('📱 Touch Target Failures');
    failedTargets.forEach(target => {
      console.warn(
        `${target.element.tagName.toLowerCase()}: ${target.width.toFixed(1)}x${target.height.toFixed(1)}px`,
        target.recommendation,
        target.element
      );
    });
    console.groupEnd();
  }

  console.groupEnd();
}

/**
 * Auto-run validation on DOM changes (development only)
 */
export function enableAutoValidation(debounceMs = 1000): () => void {
  if (process.env.NODE_ENV !== 'development' || typeof window === 'undefined') {
    return () => {};
  }

  let timeout: NodeJS.Timeout;

  const runValidation = () => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      reportSizeValidation();
    }, debounceMs);
  };

  const observer = new MutationObserver(runValidation);

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class', 'style'],
  });

  // Run initial validation
  setTimeout(runValidation, 100);

  // Return cleanup function
  return () => {
    clearTimeout(timeout);
    observer.disconnect();
  };
}