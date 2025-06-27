
import React from 'react';
import { Button } from '@/components/ui/button';
import { TableHead } from '@/components/ui/table';
import { ArrowUpAZ, ArrowDownZA } from 'lucide-react';

interface SortableTableHeadProps {
  children: React.ReactNode;
  sortKey: string;
  currentSort: { key: string; direction: 'asc' | 'desc' } | null;
  onSort: (key: string) => void;
  className?: string;
}

export const SortableTableHead: React.FC<SortableTableHeadProps> = ({
  children,
  sortKey,
  currentSort,
  onSort,
  className
}) => {
  const isActive = currentSort?.key === sortKey;
  const direction = currentSort?.direction || 'asc';

  return (
    <TableHead className={className}>
      <Button
        variant="ghost"
        size="sm"
        className="h-auto p-0 font-medium text-muted-foreground hover:text-foreground"
        onClick={() => onSort(sortKey)}
      >
        <span>{children}</span>
        {isActive ? (
          direction === 'asc' ? (
            <ArrowUpAZ className="ml-2 h-4 w-4" />
          ) : (
            <ArrowDownZA className="ml-2 h-4 w-4" />
          )
        ) : (
          <ArrowUpAZ className="ml-2 h-4 w-4 opacity-50" />
        )}
      </Button>
    </TableHead>
  );
};
