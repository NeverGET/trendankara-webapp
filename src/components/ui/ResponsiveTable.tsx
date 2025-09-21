import React from 'react';
import { cn } from '@/lib/utils';

interface ResponsiveTableProps {
  children: React.ReactNode;
  className?: string;
  stickyFirstColumn?: boolean;
  mobileScroll?: boolean;
  density?: 'compact' | 'comfortable' | 'spacious';
}

interface ResponsiveTableHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface ResponsiveTableBodyProps {
  children: React.ReactNode;
  className?: string;
}

interface ResponsiveTableRowProps {
  children: React.ReactNode;
  className?: string;
  clickable?: boolean;
  onClick?: () => void;
}

interface ResponsiveTableCellProps {
  children: React.ReactNode;
  className?: string;
  isFirstColumn?: boolean;
  align?: 'left' | 'center' | 'right';
}

const densityClasses = {
  compact: 'text-sm',
  comfortable: 'text-sm md:text-base',
  spacious: 'text-base md:text-lg',
};

const rowHeightClasses = {
  compact: 'min-h-[40px]',
  comfortable: 'min-h-[44px]',
  spacious: 'min-h-[52px]',
};

export function ResponsiveTable({
  children,
  className,
  stickyFirstColumn = false,
  mobileScroll = true,
  density = 'comfortable',
}: ResponsiveTableProps) {
  return (
    <div
      className={cn(
        'w-full rounded-lg border border-dark-border-primary bg-dark-surface-primary overflow-hidden',
        mobileScroll && 'overflow-x-auto',
        className
      )}
    >
      <table
        className={cn(
          'w-full',
          densityClasses[density],
          stickyFirstColumn && 'relative'
        )}
      >
        {children}
      </table>
    </div>
  );
}

export function ResponsiveTableHeader({
  children,
  className,
}: ResponsiveTableHeaderProps) {
  return (
    <thead
      className={cn(
        'bg-dark-surface-secondary border-b border-dark-border-primary',
        className
      )}
    >
      {children}
    </thead>
  );
}

export function ResponsiveTableBody({
  children,
  className,
}: ResponsiveTableBodyProps) {
  return <tbody className={className}>{children}</tbody>;
}

export function ResponsiveTableRow({
  children,
  className,
  clickable = false,
  onClick,
}: ResponsiveTableRowProps) {
  return (
    <tr
      className={cn(
        'border-b border-dark-border-primary/50 transition-colors',
        'hover:bg-dark-surface-secondary/50',
        clickable && 'cursor-pointer hover:bg-dark-surface-secondary',
        rowHeightClasses.comfortable,
        className
      )}
      onClick={onClick}
    >
      {children}
    </tr>
  );
}

export function ResponsiveTableCell({
  children,
  className,
  isFirstColumn = false,
  align = 'left',
}: ResponsiveTableCellProps) {
  const alignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  return (
    <td
      className={cn(
        'px-3 py-2 md:px-4 md:py-3 text-dark-text-primary',
        alignClasses[align],
        isFirstColumn && [
          'sticky left-0 z-10 bg-dark-surface-primary',
          'border-r border-dark-border-primary/50',
          'shadow-[2px_0_4px_-2px_rgba(0,0,0,0.3)]'
        ],
        className
      )}
    >
      {children}
    </td>
  );
}

export function ResponsiveTableHeaderCell({
  children,
  className,
  isFirstColumn = false,
  align = 'left',
}: ResponsiveTableCellProps) {
  const alignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  return (
    <th
      className={cn(
        'px-3 py-2 md:px-4 md:py-3 text-xs md:text-sm font-semibold text-dark-text-secondary uppercase tracking-wider',
        alignClasses[align],
        isFirstColumn && [
          'sticky left-0 z-20 bg-dark-surface-secondary',
          'border-r border-dark-border-primary/50',
          'shadow-[2px_0_4px_-2px_rgba(0,0,0,0.3)]'
        ],
        className
      )}
    >
      {children}
    </th>
  );
}

// Usage example component
export function ResponsiveTableExample() {
  const data = [
    { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'User' },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'Editor' },
  ];

  return (
    <ResponsiveTable stickyFirstColumn mobileScroll>
      <ResponsiveTableHeader>
        <ResponsiveTableRow>
          <ResponsiveTableHeaderCell isFirstColumn>
            Name
          </ResponsiveTableHeaderCell>
          <ResponsiveTableHeaderCell>Email</ResponsiveTableHeaderCell>
          <ResponsiveTableHeaderCell>Role</ResponsiveTableHeaderCell>
          <ResponsiveTableHeaderCell align="right">
            Actions
          </ResponsiveTableHeaderCell>
        </ResponsiveTableRow>
      </ResponsiveTableHeader>
      <ResponsiveTableBody>
        {data.map((item) => (
          <ResponsiveTableRow key={item.id} clickable>
            <ResponsiveTableCell isFirstColumn>
              {item.name}
            </ResponsiveTableCell>
            <ResponsiveTableCell>{item.email}</ResponsiveTableCell>
            <ResponsiveTableCell>{item.role}</ResponsiveTableCell>
            <ResponsiveTableCell align="right">
              <button className="text-brand-red-600 hover:text-brand-red-700 text-sm">
                Edit
              </button>
            </ResponsiveTableCell>
          </ResponsiveTableRow>
        ))}
      </ResponsiveTableBody>
    </ResponsiveTable>
  );
}