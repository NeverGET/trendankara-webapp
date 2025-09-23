import React, { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table-reui';
import { cn } from '@/lib/utils';
import { ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight } from 'lucide-react';

// Sorting types
type SortDirection = 'asc' | 'desc' | null;
interface SortConfig {
  key: string;
  direction: SortDirection;
}

// Legacy ResponsiveTable interfaces
interface ResponsiveTableProps {
  children: React.ReactNode;
  className?: string;
  stickyFirstColumn?: boolean;
  mobileScroll?: boolean;
  density?: 'compact' | 'comfortable' | 'spacious';
  cardView?: boolean;
  headers?: string[];
  // New sorting and pagination props
  data?: any[];
  sortable?: boolean;
  onSort?: (config: SortConfig) => void;
  paginate?: boolean;
  itemsPerPage?: number;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  totalItems?: number;
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
  sortKey?: string;
  sortable?: boolean;
  onSort?: (key: string) => void;
  sortDirection?: SortDirection;
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
  paginate = false,
  itemsPerPage = 10,
  currentPage = 1,
  onPageChange,
  totalItems = 0,
}: ResponsiveTableProps) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages && onPageChange) {
      onPageChange(page);
    }
  };

  return (
    <div className="space-y-4">
      <div
        className={cn(
          'w-full rounded-lg border border-dark-border-primary bg-dark-surface-primary overflow-hidden',
          mobileScroll && 'overflow-x-auto md:overflow-x-visible',
          className
        )}
      >
        {/* Desktop table view */}
        <Table
          className={cn(
            'w-full',
            densityClasses[density],
            stickyFirstColumn && 'relative',
            cardView ? 'hidden md:table' : 'table'
          )}
        >
          {children}
        </Table>

        {/* Mobile card view - simplified version */}
        {cardView && (
          <div className="md:hidden">
            <div className="space-y-3 p-4">
              {/* Mobile view will be handled by the children components */}
              <div className={cn("block md:hidden", densityClasses[density])}>
                {children}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Pagination controls */}
      {paginate && totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <div className="text-sm text-dark-text-secondary">
            Showing {((currentPage - 1) * itemsPerPage) + 1} to{' '}
            {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} items
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={cn(
                "p-2 rounded-md border border-dark-border-primary",
                currentPage === 1
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-dark-surface-secondary"
              )}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={cn(
                      "px-3 py-1 rounded-md text-sm",
                      pageNum === currentPage
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-dark-surface-secondary"
                    )}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={cn(
                "p-2 rounded-md border border-dark-border-primary",
                currentPage === totalPages
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-dark-surface-secondary"
              )}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function ResponsiveTableHeader({
  children,
  className,
}: ResponsiveTableHeaderProps) {
  return (
    <TableHeader
      className={cn(
        'bg-dark-surface-secondary border-b border-dark-border-primary',
        className
      )}
    >
      {children}
    </TableHeader>
  );
}

export function ResponsiveTableBody({
  children,
  className,
}: ResponsiveTableBodyProps) {
  return (
    <TableBody className={cn('divide-y divide-dark-border-primary', className)}>
      {children}
    </TableBody>
  );
}

export function ResponsiveTableRow({
  children,
  className,
  clickable = false,
  onClick,
}: ResponsiveTableRowProps) {
  return (
    <TableRow
      className={cn(
        'transition-colors',
        clickable && 'cursor-pointer hover:bg-dark-surface-secondary/50',
        className
      )}
      onClick={onClick}
    >
      {children}
    </TableRow>
  );
}

export function ResponsiveTableCell({
  children,
  className,
  isFirstColumn = false,
  align = 'left',
  sortKey,
  sortable = false,
  onSort,
  sortDirection,
}: ResponsiveTableCellProps) {
  const alignmentClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  const handleSort = () => {
    if (sortable && sortKey && onSort) {
      onSort(sortKey);
    }
  };

  const SortIcon = () => {
    if (!sortable) return null;

    if (sortDirection === 'asc') {
      return <ChevronUp className="h-4 w-4" />;
    } else if (sortDirection === 'desc') {
      return <ChevronDown className="h-4 w-4" />;
    }
    return <ChevronsUpDown className="h-4 w-4 opacity-50" />;
  };

  const content = sortable ? (
    <button
      onClick={handleSort}
      className="flex items-center gap-1 hover:text-primary transition-colors"
    >
      {children}
      <SortIcon />
    </button>
  ) : (
    children
  );

  return (
    <TableCell
      className={cn(
        'px-3 py-2 text-dark-text-primary',
        alignmentClasses[align],
        isFirstColumn && 'font-medium sticky left-0 bg-dark-surface-primary',
        sortable && 'cursor-pointer select-none',
        className
      )}
    >
      {content}
    </TableCell>
  );
}

// Export all components
export default {
  ResponsiveTable,
  ResponsiveTableHeader,
  ResponsiveTableBody,
  ResponsiveTableRow,
  ResponsiveTableCell,
};