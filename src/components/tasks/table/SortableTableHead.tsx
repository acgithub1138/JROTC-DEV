
import React from 'react';
import { Button } from '@/components/ui/button';
import { TableHead } from '@/components/ui/table';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

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

  const handleClick = () => {
    onSort(sortKey);
  };

  return (
    <TableHead className={className}>
      <div 
        className="flex items-center cursor-pointer hover:text-foreground font-medium text-muted-foreground"
        onClick={handleClick}
      >
        <span>{children}</span>
        {isActive ? (
          direction === 'asc' ? (
            <ArrowUp className="ml-2 h-4 w-4" />
          ) : (
            <ArrowDown className="ml-2 h-4 w-4" />
          )
        ) : (
          <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
        )}
      </div>
    </TableHead>
  );
};
