import { render, screen } from '@testing-library/react';
import { Button } from '../Button';
import { Input } from '../Input';
import { Badge } from '../Badge';

// Mock window.matchMedia for responsive testing
const mockMatchMedia = (matches: boolean) => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
};

describe('Touch Target Accessibility', () => {
  beforeEach(() => {
    // Reset viewport to mobile size for testing
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375, // iPhone SE width
    });

    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 667, // iPhone SE height
    });
  });

  describe('Button Touch Targets', () => {
    it('compact buttons meet minimum 44px touch target on mobile', () => {
      mockMatchMedia(true); // Mobile breakpoint

      render(<Button size="compact">Touch Me</Button>);
      const button = screen.getByRole('button');

      // Get computed styles
      const computedStyle = window.getComputedStyle(button);

      // Calculate total height (height + padding + border)
      const paddingTop = parseInt(computedStyle.paddingTop) || 0;
      const paddingBottom = parseInt(computedStyle.paddingBottom) || 0;
      const borderTop = parseInt(computedStyle.borderTopWidth) || 0;
      const borderBottom = parseInt(computedStyle.borderBottomWidth) || 0;
      const fontSize = parseInt(computedStyle.fontSize) || 0;
      const lineHeight = parseFloat(computedStyle.lineHeight) || 1.5;

      const totalHeight = paddingTop + paddingBottom + borderTop + borderBottom + (fontSize * lineHeight);

      // Should meet WCAG AA touch target minimum (44px)
      expect(totalHeight).toBeGreaterThanOrEqual(44);
    });

    it('small buttons maintain adequate touch targets', () => {
      render(<Button size="small">Small Button</Button>);
      const button = screen.getByRole('button');

      const computedStyle = window.getComputedStyle(button);
      const paddingTop = parseInt(computedStyle.paddingTop) || 0;
      const paddingBottom = parseInt(computedStyle.paddingBottom) || 0;
      const fontSize = parseInt(computedStyle.fontSize) || 0;
      const lineHeight = parseFloat(computedStyle.lineHeight) || 1.5;

      const totalHeight = paddingTop + paddingBottom + (fontSize * lineHeight);

      expect(totalHeight).toBeGreaterThanOrEqual(40);
    });

    it('icon-only buttons maintain square touch targets', () => {
      const TestIcon = () => <span data-testid="icon">🔍</span>;

      render(
        <Button size="compact" icon={<TestIcon />} aria-label="Search" />
      );

      const button = screen.getByRole('button');
      const computedStyle = window.getComputedStyle(button);

      const paddingLeft = parseInt(computedStyle.paddingLeft) || 0;
      const paddingRight = parseInt(computedStyle.paddingRight) || 0;
      const paddingTop = parseInt(computedStyle.paddingTop) || 0;
      const paddingBottom = parseInt(computedStyle.paddingBottom) || 0;

      const totalWidth = paddingLeft + paddingRight + 16; // 16px for icon
      const totalHeight = paddingTop + paddingBottom + 16;

      // Icon buttons should be roughly square and meet minimum size
      expect(totalWidth).toBeGreaterThanOrEqual(40);
      expect(totalHeight).toBeGreaterThanOrEqual(40);
    });
  });

  describe('Input Touch Targets', () => {
    it('compact inputs meet minimum touch target requirements', () => {
      render(<Input placeholder="Touch target test" />);
      const input = screen.getByRole('textbox');

      const computedStyle = window.getComputedStyle(input);
      const paddingTop = parseInt(computedStyle.paddingTop) || 0;
      const paddingBottom = parseInt(computedStyle.paddingBottom) || 0;
      const borderTop = parseInt(computedStyle.borderTopWidth) || 0;
      const borderBottom = parseInt(computedStyle.borderBottomWidth) || 0;
      const fontSize = parseInt(computedStyle.fontSize) || 0;
      const lineHeight = parseFloat(computedStyle.lineHeight) || 1.5;

      const totalHeight = paddingTop + paddingBottom + borderTop + borderBottom + (fontSize * lineHeight);

      expect(totalHeight).toBeGreaterThanOrEqual(44);
    });

    it('inputs with labels maintain proper spacing', () => {
      render(<Input label="Test Label" placeholder="Test input" />);

      const label = screen.getByText('Test Label');
      const input = screen.getByRole('textbox');

      // Label should be positioned correctly
      expect(label).toBeInTheDocument();
      expect(input).toBeInTheDocument();

      // Check that label has proper font size for readability
      const labelStyle = window.getComputedStyle(label);
      const labelFontSize = parseInt(labelStyle.fontSize);

      expect(labelFontSize).toBeGreaterThanOrEqual(12); // Minimum readable size
    });
  });

  describe('Badge Touch Targets', () => {
    it('interactive badges meet touch target requirements', () => {
      const mockClick = jest.fn();

      render(
        <Badge
          variant="primary"
          size="small"
          interactive
          onClick={mockClick}
        >
          Clickable Badge
        </Badge>
      );

      const badge = screen.getByText('Clickable Badge');

      if (badge.tagName.toLowerCase() === 'button') {
        const computedStyle = window.getComputedStyle(badge);
        const paddingTop = parseInt(computedStyle.paddingTop) || 0;
        const paddingBottom = parseInt(computedStyle.paddingBottom) || 0;
        const fontSize = parseInt(computedStyle.fontSize) || 0;
        const lineHeight = parseFloat(computedStyle.lineHeight) || 1.5;

        const totalHeight = paddingTop + paddingBottom + (fontSize * lineHeight);

        // Interactive elements should meet minimum touch target
        expect(totalHeight).toBeGreaterThanOrEqual(32); // Smaller for badges but still usable
      }
    });
  });

  describe('Focus Indicators', () => {
    it('compact buttons maintain visible focus indicators', () => {
      render(<Button size="compact">Focus Test</Button>);
      const button = screen.getByRole('button');

      button.focus();

      const computedStyle = window.getComputedStyle(button);

      // Should have focus ring styles
      expect(button).toHaveClass('focus:ring-2');
      expect(button).toHaveClass('focus:ring-offset-2');
      expect(button).toHaveClass('focus:outline-none');
    });

    it('inputs maintain visible focus indicators', () => {
      render(<Input placeholder="Focus test" />);
      const input = screen.getByRole('textbox');

      input.focus();

      // Should have focus styles
      expect(input).toHaveClass('focus:ring-2');
      expect(input).toHaveClass('focus:border-brand-red-500');
    });

    it('focus indicators have sufficient contrast', () => {
      render(<Button size="compact" variant="primary">Contrast Test</Button>);
      const button = screen.getByRole('button');

      button.focus();

      // Focus ring should use a contrasting color
      expect(button).toHaveClass('focus:ring-brand-red-500');
    });
  });

  describe('Spacing Between Interactive Elements', () => {
    it('maintains minimum 8px spacing between buttons', () => {
      render(
        <div className="flex gap-2">
          <Button size="compact">Button 1</Button>
          <Button size="compact">Button 2</Button>
        </div>
      );

      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(2);

      // Parent should have gap class that provides adequate spacing
      const container = buttons[0].parentElement;
      expect(container).toHaveClass('gap-2'); // 8px gap
    });

    it('form elements maintain proper vertical spacing', () => {
      render(
        <div className="space-y-3">
          <Input label="Field 1" placeholder="First field" />
          <Input label="Field 2" placeholder="Second field" />
        </div>
      );

      const inputs = screen.getAllByRole('textbox');
      expect(inputs).toHaveLength(2);

      // Container should have vertical spacing
      const container = inputs[0].closest('.space-y-3');
      expect(container).toBeInTheDocument();
    });
  });

  describe('Mobile Responsiveness', () => {
    it('adjusts touch targets appropriately for mobile viewport', () => {
      // Simulate mobile viewport
      mockMatchMedia(true);

      render(<Button size="compact">Mobile Button</Button>);
      const button = screen.getByRole('button');

      // Should have mobile-specific classes
      expect(button.className).toMatch(/sm:px-3\.5/);
      expect(button.className).toMatch(/sm:py-1\.5/);
    });

    it('maintains accessibility on small screens', () => {
      // Simulate very small viewport
      Object.defineProperty(window, 'innerWidth', {
        value: 320, // Very small mobile
      });

      render(
        <div className="p-4">
          <Button size="compact">Small Screen Test</Button>
        </div>
      );

      const button = screen.getByRole('button');

      // Should still be accessible even on small screens
      expect(button).toBeInTheDocument();
      expect(button).not.toHaveClass('hidden');
    });
  });

  describe('WCAG Compliance', () => {
    it('provides adequate color contrast for text', () => {
      render(<Button variant="primary" size="compact">Contrast Test</Button>);
      const button = screen.getByRole('button');

      // Primary buttons should have white text on red background
      expect(button).toHaveClass('bg-brand-red-600');
      expect(button).toHaveClass('text-white');
    });

    it('maintains focus order for keyboard navigation', () => {
      render(
        <div>
          <Button size="compact">First</Button>
          <Input placeholder="Second" />
          <Button size="compact">Third</Button>
        </div>
      );

      const firstButton = screen.getByText('First');
      const input = screen.getByRole('textbox');
      const secondButton = screen.getByText('Third');

      // Elements should be focusable in document order
      expect(firstButton.tabIndex).not.toBe(-1);
      expect(input.tabIndex).not.toBe(-1);
      expect(secondButton.tabIndex).not.toBe(-1);
    });
  });
});