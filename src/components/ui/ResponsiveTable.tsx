import React from 'react';
import { cn } from '@/lib/utils';

interface ResponsiveTableProps {
  children: React.ReactNode;
  className?: string;
  stickyFirstColumn?: boolean;
  mobileScroll?: boolean;
  density?: 'compact' | 'comfortable' | 'spacious';
  cardView?: boolean;
  headers?: string[];
}

interface TableRowData {
  id?: string | number;
  cells: React.ReactNode[];
  onClick?: () => void;
  clickable?: boolean;
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
  cardView = true,
  headers = [],
}: ResponsiveTableProps) {
  return (
    <div
      className={cn(
        'w-full rounded-lg border border-dark-border-primary bg-dark-surface-primary overflow-hidden',
        mobileScroll && 'overflow-x-auto md:overflow-x-visible',
        className
      )}
    >
      {/* Desktop table view - hidden on mobile when cardView is enabled */}
      <table
        className={cn(
          'w-full',
          densityClasses[density],
          stickyFirstColumn && 'relative',
          cardView ? 'hidden md:table' : 'table'
        )}
      >
        {children}
      </table>

      {/* Mobile card view - only shown when cardView is enabled and on mobile */}
      {cardView && (
        <div className="md:hidden">
          <ResponsiveTableMobileView density={density}>
            {children}
          </ResponsiveTableMobileView>
        </div>
      )}
    </div>
  );
}

// Mobile card view component
function ResponsiveTableMobileView({
  children,
  density = 'comfortable',
}: {
  children: React.ReactNode;
  density?: 'compact' | 'comfortable' | 'spacious';
}) {
  const extractTableData = (children: React.ReactNode): { headers: string[]; rows: TableRowData[] } => {
    const headers: string[] = [];
    const rows: TableRowData[] = [];

    React.Children.forEach(children, (child) => {
      if (React.isValidElement(child)) {
        if (child.type === ResponsiveTableHeader) {
          // Extract headers
          React.Children.forEach(child.props.children, (headerRow) => {
            if (React.isValidElement(headerRow)) {
              React.Children.forEach(headerRow.props.children, (headerCell) => {
                if (React.isValidElement(headerCell)) {
                  const headerText = typeof headerCell.props.children === 'string'
                    ? headerCell.props.children
                    : 'Column';
                  headers.push(headerText);
                }
              });
            }
          });
        } else if (child.type === ResponsiveTableBody) {
          // Extract rows
          React.Children.forEach(child.props.children, (row, rowIndex) => {
            if (React.isValidElement(row)) {
              const cells: React.ReactNode[] = [];
              let rowProps = { clickable: false, onClick: undefined };

              if (row.props.clickable) rowProps.clickable = true;
              if (row.props.onClick) rowProps.onClick = row.props.onClick;

              React.Children.forEach(row.props.children, (cell) => {
                if (React.isValidElement(cell)) {
                  cells.push(cell.props.children);
                }
              });

              rows.push({
                id: rowIndex,
                cells,
                ...rowProps,
              });
            }
          });
        }
      }
    });

    return { headers, rows };
  };

  const { headers, rows } = extractTableData(children);

  const cardSpacingClasses = {
    compact: 'p-3 space-y-2',
    comfortable: 'p-4 space-y-3',
    spacious: 'p-5 space-y-4',
  };

  return (
    <div className="space-y-3 p-4">
      {rows.map((row, index) => (
        <div
          key={row.id || index}
          className={cn(
            'bg-dark-surface-secondary rounded-lg border border-dark-border-primary transition-colors',
            row.clickable && 'cursor-pointer hover:bg-dark-surface-secondary/80',
            cardSpacingClasses[density]
          )}
          onClick={row.onClick}
        >
          {row.cells.map((cell, cellIndex) => (
            <div key={cellIndex} className="flex flex-col space-y-1">
              {headers[cellIndex] && (
                <div className="text-xs font-semibold text-dark-text-secondary uppercase tracking-wider">
                  {headers[cellIndex]}
                </div>
              )}
              <div className={cn(
                'text-dark-text-primary',
                densityClasses[density]
              )}>
                {cell}
              </div>
            </div>
          ))}
        </div>
      ))}
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

// Usage example component - demonstrates both table and card views
export function ResponsiveTableExample() {
  const data = [
    { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'User' },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'Editor' },
  ];

  return (
    <ResponsiveTable
      stickyFirstColumn
      mobileScroll
      cardView={true}
      density="comfortable"
    >
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
          <ResponsiveTableRow key={item.id} clickable onClick={() => console.log('Row clicked:', item)}>
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