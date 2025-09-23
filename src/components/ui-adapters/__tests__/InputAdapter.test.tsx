import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Input } from '../InputAdapter';

describe('InputAdapter', () => {
  it('renders with label', () => {
    render(<Input label="Email" name="email" />);
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  it('shows required indicator when required', () => {
    render(<Input label="Email" name="email" required />);
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('displays error message', () => {
    render(<Input label="Email" name="email" error="Email is required" />);
    expect(screen.getByText('Email is required')).toBeInTheDocument();
  });

  it('applies error styling when error is present', () => {
    render(<Input label="Email" name="email" error="Error" />);
    const input = screen.getByLabelText('Email');
    expect(input).toHaveClass('border-red-600');
  });

  it('handles value changes', () => {
    const handleChange = jest.fn();
    render(<Input label="Email" name="email" onChange={handleChange} />);

    const input = screen.getByLabelText('Email');
    fireEvent.change(input, { target: { value: 'test@example.com' } });

    expect(handleChange).toHaveBeenCalled();
  });

  it('can be disabled', () => {
    render(<Input label="Email" name="email" disabled />);
    const input = screen.getByLabelText('Email');
    expect(input).toBeDisabled();
  });

  it('supports different input types', () => {
    const { rerender } = render(<Input label="Password" name="password" type="password" />);
    let input = screen.getByLabelText('Password');
    expect(input).toHaveAttribute('type', 'password');

    rerender(<Input label="Number" name="number" type="number" />);
    input = screen.getByLabelText('Number');
    expect(input).toHaveAttribute('type', 'number');

    rerender(<Input label="Email" name="email" type="email" />);
    input = screen.getByLabelText('Email');
    expect(input).toHaveAttribute('type', 'email');
  });

  it('applies custom className', () => {
    render(<Input label="Email" name="email" className="custom-input" />);
    const input = screen.getByLabelText('Email');
    expect(input).toHaveClass('custom-input');
  });

  it('supports placeholder text', () => {
    render(<Input label="Email" name="email" placeholder="Enter your email" />);
    const input = screen.getByLabelText('Email');
    expect(input).toHaveAttribute('placeholder', 'Enter your email');
  });

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLInputElement>();
    render(<Input label="Email" name="email" ref={ref} />);

    expect(ref.current).toBeInstanceOf(HTMLInputElement);
    expect(ref.current?.name).toBe('email');
  });
});