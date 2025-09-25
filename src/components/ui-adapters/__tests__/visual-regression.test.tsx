/**
 * Visual Regression Testing for ReUI Components
 *
 * This test suite captures snapshots of all migrated components
 * to detect unintended visual changes during updates.
 */

import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';

// Import all components
import { Button } from '../ButtonAdapter';
import { Input } from '../InputAdapter';
import { Card } from '../CardAdapter';
import { Checkbox } from '../CheckboxAdapter';
import { Select } from '../SelectAdapter';
import { ProgressAdapter } from '../ProgressAdapter';
import { Alert } from '../AlertAdapter';
import { BadgeAdapter } from '../BadgeAdapter';
import { ResponsiveTable, ResponsiveTableHeader, ResponsiveTableBody, ResponsiveTableRow, ResponsiveTableCell } from '../ResponsiveTableAdapter';

describe('Visual Regression Tests', () => {
  describe('Button Component Snapshots', () => {
    it('renders primary button correctly', () => {
      const { container } = render(
        <Button variant="primary">Primary Button</Button>
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('renders secondary button correctly', () => {
      const { container } = render(
        <Button variant="secondary">Secondary Button</Button>
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('renders danger button correctly', () => {
      const { container } = render(
        <Button variant="danger">Danger Button</Button>
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('renders loading button correctly', () => {
      const { container } = render(
        <Button loading>Loading Button</Button>
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('renders disabled button correctly', () => {
      const { container } = render(
        <Button disabled>Disabled Button</Button>
      );
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe('Input Component Snapshots', () => {
    it('renders basic input correctly', () => {
      const { container } = render(
        <Input label="Email" name="email" placeholder="user@example.com" />
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('renders input with error correctly', () => {
      const { container } = render(
        <Input
          label="Password"
          name="password"
          type="password"
          error="Password is required"
        />
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('renders required input correctly', () => {
      const { container } = render(
        <Input label="Username" name="username" required />
      );
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe('Card Component Snapshots', () => {
    it('renders basic card correctly', () => {
      const { container } = render(
        <Card>
          <p>Card content goes here</p>
        </Card>
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('renders card with title and subtitle correctly', () => {
      const { container } = render(
        <Card title="Card Title" subtitle="Card subtitle">
          <p>Card body content</p>
        </Card>
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('renders gradient card correctly', () => {
      const { container } = render(
        <Card hasGradient hoverable>
          <p>Gradient hoverable card</p>
        </Card>
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('renders card with footer correctly', () => {
      const { container } = render(
        <Card
          title="Action Card"
          footer={
            <div className="flex justify-end space-x-2">
              <Button variant="secondary">Cancel</Button>
              <Button variant="primary">Save</Button>
            </div>
          }
        >
          <p>Card with action buttons</p>
        </Card>
      );
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe('Alert Component Snapshots', () => {
    it('renders success alert correctly', () => {
      const { container } = render(
        <Alert variant="success" title="Success!">
          Operation completed successfully
        </Alert>
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('renders error alert correctly', () => {
      const { container } = render(
        <Alert variant="error" title="Error!" dismissible>
          An error occurred while processing
        </Alert>
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('renders warning alert correctly', () => {
      const { container } = render(
        <Alert variant="warning" title="Warning">
          Please review before continuing
        </Alert>
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('renders info alert correctly', () => {
      const { container } = render(
        <Alert variant="info" title="Information">
          Here is some helpful information
        </Alert>
      );
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe('Badge Component Snapshots', () => {
    it('renders all badge variants correctly', () => {
      const { container } = render(
        <div className="flex space-x-2">
          <BadgeAdapter variant="default">Default</BadgeAdapter>
          <BadgeAdapter variant="success">Success</BadgeAdapter>
          <BadgeAdapter variant="warning">Warning</BadgeAdapter>
          <BadgeAdapter variant="error">Error</BadgeAdapter>
          <BadgeAdapter variant="info">Info</BadgeAdapter>
        </div>
      );
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe('Select Component Snapshots', () => {
    it('renders select with options correctly', () => {
      const { container } = render(
        <Select
          label="Choose an option"
          placeholder="Select..."
          options={[
            { value: 'option1', label: 'Option 1' },
            { value: 'option2', label: 'Option 2' },
            { value: 'option3', label: 'Option 3', disabled: true },
          ]}
        />
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('renders select with error correctly', () => {
      const { container } = render(
        <Select
          label="Required Selection"
          required
          error="Please select an option"
          options={[
            { value: 'yes', label: 'Yes' },
            { value: 'no', label: 'No' },
          ]}
        />
      );
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe('Progress Component Snapshots', () => {
    it('renders progress bars at different values correctly', () => {
      const { container } = render(
        <div className="space-y-4">
          <ProgressAdapter value={0} label="Starting" showLabel />
          <ProgressAdapter value={25} label="Quarter" showLabel variant="warning" />
          <ProgressAdapter value={50} label="Halfway" showLabel variant="info" />
          <ProgressAdapter value={75} label="Almost" showLabel variant="success" />
          <ProgressAdapter value={100} label="Complete" showLabel variant="success" />
        </div>
      );
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe('Checkbox Component Snapshots', () => {
    it('renders checkbox with label correctly', () => {
      const { container } = render(
        <Checkbox label="I agree to the terms" />
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('renders checkbox with error correctly', () => {
      const { container } = render(
        <Checkbox
          label="Required checkbox"
          error="You must agree to continue"
        />
      );
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe('Table Component Snapshots', () => {
    it('renders responsive table correctly', () => {
      const { container } = render(
        <ResponsiveTable>
          <ResponsiveTableHeader>
            <ResponsiveTableRow>
              <ResponsiveTableCell sortable sortKey="name">Name</ResponsiveTableCell>
              <ResponsiveTableCell sortable sortKey="email">Email</ResponsiveTableCell>
              <ResponsiveTableCell>Actions</ResponsiveTableCell>
            </ResponsiveTableRow>
          </ResponsiveTableHeader>
          <ResponsiveTableBody>
            <ResponsiveTableRow>
              <ResponsiveTableCell>John Doe</ResponsiveTableCell>
              <ResponsiveTableCell>john@example.com</ResponsiveTableCell>
              <ResponsiveTableCell>
                <Button variant="ghost" size="small">Edit</Button>
              </ResponsiveTableCell>
            </ResponsiveTableRow>
            <ResponsiveTableRow>
              <ResponsiveTableCell>Jane Smith</ResponsiveTableCell>
              <ResponsiveTableCell>jane@example.com</ResponsiveTableCell>
              <ResponsiveTableCell>
                <Button variant="ghost" size="small">Edit</Button>
              </ResponsiveTableCell>
            </ResponsiveTableRow>
          </ResponsiveTableBody>
        </ResponsiveTable>
      );
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe('Dark Theme Consistency Snapshots', () => {
    it('renders components with consistent dark theme', () => {
      const { container } = render(
        <div className="bg-dark-bg-primary p-8 space-y-4">
          <Card title="Dark Theme Card" hasGradient>
            <div className="space-y-4">
              <Input label="Dark Input" placeholder="Type here..." />
              <Select
                label="Dark Select"
                options={[
                  { value: 'dark', label: 'Dark Mode' },
                  { value: 'light', label: 'Light Mode' },
                ]}
              />
              <Checkbox label="Dark Checkbox" />
              <div className="flex space-x-2">
                <Button variant="primary">Primary</Button>
                <Button variant="secondary">Secondary</Button>
              </div>
            </div>
          </Card>
          <Alert variant="info" title="Dark Alert">
            This alert uses dark theme colors
          </Alert>
          <div className="flex space-x-2">
            <BadgeAdapter variant="success">Active</BadgeAdapter>
            <BadgeAdapter variant="warning">Pending</BadgeAdapter>
            <BadgeAdapter variant="error">Error</BadgeAdapter>
          </div>
        </div>
      );
      expect(container.firstChild).toMatchSnapshot();
    });
  });
});