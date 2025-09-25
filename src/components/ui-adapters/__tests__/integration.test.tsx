import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Import all adapters
import { Button } from '../ButtonAdapter';
import { Input } from '../InputAdapter';
import { Card } from '../CardAdapter';
import { Checkbox } from '../CheckboxAdapter';
import { Select } from '../SelectAdapter';
import { ProgressAdapter } from '../ProgressAdapter';
import { Alert } from '../AlertAdapter';
import { BadgeAdapter } from '../BadgeAdapter';

describe('ReUI Component Integration Tests', () => {
  describe('Form Integration', () => {
    it('renders a complete form with all input components', () => {
      const handleSubmit = jest.fn();

      render(
        <Card title="User Registration">
          <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
            <div className="space-y-4">
              <Input
                label="Email"
                name="email"
                type="email"
                required
                placeholder="user@example.com"
              />
              <Input
                label="Password"
                name="password"
                type="password"
                required
              />
              <Select
                label="Country"
                options={[
                  { value: 'us', label: 'United States' },
                  { value: 'uk', label: 'United Kingdom' },
                  { value: 'ca', label: 'Canada' },
                ]}
              />
              <Checkbox
                label="I agree to the terms and conditions"
                required
              />
              <Button type="submit" variant="primary" fullWidth>
                Register
              </Button>
            </div>
          </form>
        </Card>
      );

      // Verify all components render
      expect(screen.getByText('User Registration')).toBeInTheDocument();
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.getByLabelText('Password')).toBeInTheDocument();
      expect(screen.getByText('Country')).toBeInTheDocument();
      expect(screen.getByLabelText('I agree to the terms and conditions')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Register' })).toBeInTheDocument();
    });

    it('handles form validation and error states', () => {
      render(
        <div className="space-y-4">
          <Input
            label="Email"
            name="email"
            error="Email is required"
          />
          <Alert variant="error" title="Form Error">
            Please correct the errors below
          </Alert>
        </div>
      );

      // Check error states
      expect(screen.getByText('Email is required')).toBeInTheDocument();
      expect(screen.getByText('Form Error')).toBeInTheDocument();
      expect(screen.getByText('Please correct the errors below')).toBeInTheDocument();

      // Check error styling
      const input = screen.getByLabelText('Email');
      expect(input).toHaveClass('border-red-600');
    });
  });

  describe('Interactive Components', () => {
    it('handles button loading and disabled states', async () => {
      const { rerender } = render(
        <Button loading>Loading</Button>
      );

      // Check loading state
      expect(screen.getByRole('button')).toBeDisabled();

      // Update to normal state
      rerender(<Button>Click Me</Button>);
      expect(screen.getByRole('button')).not.toBeDisabled();

      // Update to disabled state
      rerender(<Button disabled>Disabled</Button>);
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('handles checkbox interactions', () => {
      const handleChange = jest.fn();

      render(
        <Checkbox
          label="Subscribe to newsletter"
          onChange={handleChange}
        />
      );

      const checkbox = screen.getByLabelText('Subscribe to newsletter');

      // Initial state
      expect(checkbox).not.toBeChecked();

      // Click checkbox
      fireEvent.click(checkbox);
      expect(handleChange).toHaveBeenCalled();
    });

    it('handles select interactions', () => {
      const handleChange = jest.fn();

      render(
        <Select
          label="Theme"
          value="dark"
          onValueChange={handleChange}
          options={[
            { value: 'light', label: 'Light' },
            { value: 'dark', label: 'Dark' },
            { value: 'auto', label: 'Auto' },
          ]}
        />
      );

      expect(screen.getByText('Theme')).toBeInTheDocument();
    });
  });

  describe('Progress and Status Components', () => {
    it('renders progress indicators correctly', () => {
      render(
        <div className="space-y-4">
          <ProgressAdapter value={50} max={100} showLabel label="Upload Progress" />
          <BadgeAdapter variant="success">Active</BadgeAdapter>
          <BadgeAdapter variant="warning">Pending</BadgeAdapter>
          <BadgeAdapter variant="error">Failed</BadgeAdapter>
        </div>
      );

      // Check progress
      expect(screen.getByText('Upload Progress')).toBeInTheDocument();
      expect(screen.getByText('50%')).toBeInTheDocument();

      // Check badges
      expect(screen.getByText('Active')).toBeInTheDocument();
      expect(screen.getByText('Pending')).toBeInTheDocument();
      expect(screen.getByText('Failed')).toBeInTheDocument();
    });
  });

  describe('Card and Layout Components', () => {
    it('renders nested cards with all features', () => {
      render(
        <Card
          title="Dashboard"
          subtitle="Overview of your account"
          hasGradient
          hoverable
          footer={
            <div className="flex justify-end space-x-2">
              <Button variant="secondary">Cancel</Button>
              <Button variant="primary">Save</Button>
            </div>
          }
        >
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <h3>Statistics</h3>
              <p>View your stats</p>
            </Card>
            <Card>
              <h3>Activity</h3>
              <p>Recent activity</p>
            </Card>
          </div>
        </Card>
      );

      // Check main card
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Overview of your account')).toBeInTheDocument();

      // Check nested cards
      expect(screen.getByText('Statistics')).toBeInTheDocument();
      expect(screen.getByText('Activity')).toBeInTheDocument();

      // Check footer buttons
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
    });
  });

  describe('Alert and Notification Components', () => {
    it('renders all alert variants', () => {
      render(
        <div className="space-y-4">
          <Alert variant="success" title="Success">
            Operation completed successfully
          </Alert>
          <Alert variant="error" title="Error" dismissible>
            An error occurred
          </Alert>
          <Alert variant="warning" title="Warning">
            Please review before continuing
          </Alert>
          <Alert variant="info" title="Information">
            Here is some helpful information
          </Alert>
        </div>
      );

      // Check all alerts render
      expect(screen.getByText('Success')).toBeInTheDocument();
      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText('Warning')).toBeInTheDocument();
      expect(screen.getByText('Information')).toBeInTheDocument();

      // Check dismissible alert has close button
      const dismissButtons = screen.getAllByLabelText('Dismiss');
      expect(dismissButtons.length).toBeGreaterThan(0);
    });

    it('handles alert dismissal', () => {
      const handleDismiss = jest.fn();

      render(
        <Alert
          variant="info"
          title="Dismissible Alert"
          dismissible
          onDismiss={handleDismiss}
        >
          Click X to dismiss
        </Alert>
      );

      const dismissButton = screen.getByLabelText('Dismiss');
      fireEvent.click(dismissButton);

      expect(handleDismiss).toHaveBeenCalled();
    });
  });

  describe('Theme Consistency', () => {
    it('applies dark theme classes consistently', () => {
      const { container } = render(
        <div>
          <Card>
            <Button variant="primary">Primary</Button>
            <Input label="Test Input" />
            <Alert variant="default">Default Alert</Alert>
          </Card>
        </div>
      );

      // Check for dark theme classes
      const card = container.querySelector('.bg-dark-surface-primary');
      expect(card).toBeInTheDocument();

      // Check for border colors
      const borders = container.querySelectorAll('.border-dark-border-primary');
      expect(borders.length).toBeGreaterThan(0);
    });
  });
});