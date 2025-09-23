import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Card } from '../CardAdapter';

describe('CardAdapter', () => {
  it('renders children correctly', () => {
    render(
      <Card>
        <h2>Card Title</h2>
        <p>Card content</p>
      </Card>
    );

    expect(screen.getByText('Card Title')).toBeInTheDocument();
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('renders with title and subtitle', () => {
    render(
      <Card title="Main Title" subtitle="Subtitle text">
        <p>Card body</p>
      </Card>
    );

    expect(screen.getByText('Main Title')).toBeInTheDocument();
    expect(screen.getByText('Subtitle text')).toBeInTheDocument();
    expect(screen.getByText('Card body')).toBeInTheDocument();
  });

  it('applies gradient background when hasGradient is true', () => {
    const { container } = render(
      <Card hasGradient>
        <p>Gradient card</p>
      </Card>
    );

    const card = container.firstChild;
    expect(card).toHaveClass('bg-gradient-to-br');
  });

  it('applies hover effect when hoverable is true', () => {
    const { container } = render(
      <Card hoverable>
        <p>Hoverable card</p>
      </Card>
    );

    const card = container.firstChild;
    expect(card).toHaveClass('hover:shadow-lg');
  });

  it('applies custom className', () => {
    const { container } = render(
      <Card className="custom-card-class">
        <p>Custom card</p>
      </Card>
    );

    const card = container.firstChild;
    expect(card).toHaveClass('custom-card-class');
  });

  it('renders footer when provided', () => {
    render(
      <Card footer={<button>Action</button>}>
        <p>Card with footer</p>
      </Card>
    );

    expect(screen.getByText('Card with footer')).toBeInTheDocument();
    expect(screen.getByText('Action')).toBeInTheDocument();
  });

  it('applies dark theme classes by default', () => {
    const { container } = render(
      <Card>
        <p>Dark theme card</p>
      </Card>
    );

    const card = container.firstChild;
    expect(card).toHaveClass('bg-dark-surface-primary');
    expect(card).toHaveClass('border-dark-border-primary');
  });

  it('combines all props correctly', () => {
    const { container } = render(
      <Card
        title="Complete Card"
        subtitle="With all features"
        hasGradient
        hoverable
        className="extra-class"
        footer={<div>Footer content</div>}
      >
        <p>Main content</p>
      </Card>
    );

    const card = container.firstChild;

    expect(screen.getByText('Complete Card')).toBeInTheDocument();
    expect(screen.getByText('With all features')).toBeInTheDocument();
    expect(screen.getByText('Main content')).toBeInTheDocument();
    expect(screen.getByText('Footer content')).toBeInTheDocument();

    expect(card).toHaveClass('bg-gradient-to-br');
    expect(card).toHaveClass('hover:shadow-lg');
    expect(card).toHaveClass('extra-class');
  });
});