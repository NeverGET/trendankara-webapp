import { render, screen } from '@testing-library/react';
import { Button } from '../Button';

describe('Button - Compact Sizing', () => {
  describe('Size Variants', () => {
    it('renders compact size with correct classes', () => {
      render(<Button size="compact">Compact Button</Button>);
      const button = screen.getByRole('button');

      expect(button).toHaveClass('px-3', 'py-1', 'text-xs');
      expect(button).toHaveClass('sm:px-3.5', 'sm:py-1.5', 'sm:text-sm');
    });

    it('renders small size with correct classes', () => {
      render(<Button size="small">Small Button</Button>);
      const button = screen.getByRole('button');

      expect(button).toHaveClass('px-3', 'py-1.5', 'text-sm');
    });

    it('renders medium size with correct classes', () => {
      render(<Button size="medium">Medium Button</Button>);
      const button = screen.getByRole('button');

      expect(button).toHaveClass('px-4', 'py-2', 'text-sm');
    });

    it('renders large size with correct classes', () => {
      render(<Button size="large">Large Button</Button>);
      const button = screen.getByRole('button');

      expect(button).toHaveClass('px-5', 'py-3', 'text-base');
    });
  });

  describe('Variant Classes', () => {
    it('renders primary variant with correct classes', () => {
      render(<Button variant="primary" size="compact">Primary</Button>);
      const button = screen.getByRole('button');

      expect(button).toHaveClass('bg-brand-red-600', 'text-white');
      expect(button).toHaveClass('hover:bg-brand-red-700');
    });

    it('renders secondary variant with correct classes', () => {
      render(<Button variant="secondary" size="compact">Secondary</Button>);
      const button = screen.getByRole('button');

      expect(button).toHaveClass('bg-dark-surface-secondary', 'text-dark-text-primary');
      expect(button).toHaveClass('hover:bg-dark-surface-primary');
    });

    it('renders ghost variant with improved visibility', () => {
      render(<Button variant="ghost" size="compact">Ghost</Button>);
      const button = screen.getByRole('button');

      expect(button).toHaveClass('bg-dark-surface-secondary/30');
      expect(button).toHaveClass('hover:bg-dark-surface-primary/50');
      expect(button).toHaveClass('text-dark-text-primary');
    });

    it('renders danger variant with correct classes', () => {
      render(<Button variant="danger" size="compact">Danger</Button>);
      const button = screen.getByRole('button');

      expect(button).toHaveClass('bg-red-600', 'text-white');
      expect(button).toHaveClass('hover:bg-red-700');
    });
  });

  describe('Mobile Modifiers', () => {
    it('applies mobile touch target modifiers for compact size', () => {
      render(<Button size="compact">Mobile Compact</Button>);
      const button = screen.getByRole('button');

      // Check for responsive classes
      expect(button.className).toMatch(/sm:px-3\.5/);
      expect(button.className).toMatch(/sm:py-1\.5/);
      expect(button.className).toMatch(/sm:text-sm/);
    });

    it('maintains minimum touch target requirements', () => {
      render(<Button size="compact">Touch Target</Button>);
      const button = screen.getByRole('button');

      // Button should have minimum height for touch targets
      const computedStyle = window.getComputedStyle(button);
      const minHeight = parseInt(computedStyle.minHeight);

      // Should be at least 40px for compact, but may be larger due to padding
      expect(minHeight).toBeGreaterThanOrEqual(40);
    });
  });

  describe('Accessibility', () => {
    it('maintains focus indicators for compact buttons', () => {
      render(<Button size="compact">Focus Test</Button>);
      const button = screen.getByRole('button');

      expect(button).toHaveClass('focus:outline-none');
      expect(button).toHaveClass('focus:ring-2');
      expect(button).toHaveClass('focus:ring-offset-2');
    });

    it('preserves disabled state styling', () => {
      render(<Button size="compact" disabled>Disabled</Button>);
      const button = screen.getByRole('button');

      expect(button).toHaveClass('disabled:opacity-50');
      expect(button).toHaveClass('disabled:cursor-not-allowed');
      expect(button).toBeDisabled();
    });
  });

  describe('Loading State', () => {
    it('maintains compact sizing in loading state', () => {
      render(<Button size="compact" loading>Loading</Button>);
      const button = screen.getByRole('button');

      expect(button).toHaveClass('px-3', 'py-1', 'text-xs');
      expect(button).toHaveClass('sm:px-3.5', 'sm:py-1.5', 'sm:text-sm');
      expect(button).toBeDisabled();
    });
  });

  describe('Icon Integration', () => {
    it('renders compact button with icon correctly', () => {
      const TestIcon = () => <span data-testid="test-icon">🔍</span>;

      render(
        <Button size="compact" icon={<TestIcon />}>
          Search
        </Button>
      );

      const button = screen.getByRole('button');
      const icon = screen.getByTestId('test-icon');

      expect(button).toHaveClass('px-3', 'py-1', 'text-xs');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('Responsive Behavior', () => {
    it('uses correct breakpoint classes', () => {
      render(<Button size="compact">Responsive</Button>);
      const button = screen.getByRole('button');

      // Check that sm: breakpoint is used for mobile adjustments
      expect(button.className).toMatch(/sm:/);

      // Verify base classes are applied
      expect(button).toHaveClass('px-3', 'py-1', 'text-xs');
    });
  });
});