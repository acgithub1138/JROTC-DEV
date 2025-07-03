import React from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Settings2 } from 'lucide-react';
import { ColumnPreference } from '@/hooks/useColumnPreferences';

interface ColumnSelectorProps {
  columns: ColumnPreference[];
  onToggleColumn: (columnKey: string) => void;
  isLoading?: boolean;
}

export const ColumnSelector: React.FC<ColumnSelectorProps> = ({
  columns,
  onToggleColumn,
  isLoading = false
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={isLoading}>
          <Settings2 className="w-4 h-4 mr-2" />
          Columns
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-56 bg-background border border-border shadow-lg z-50"
      >
        <DropdownMenuLabel className="text-sm font-semibold">
          Show Columns
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-64 overflow-y-auto">
          {columns.map((column) => (
            <DropdownMenuItem
              key={column.key}
              className="flex items-center space-x-2 cursor-pointer hover:bg-accent"
              onClick={(e) => {
                e.preventDefault();
                onToggleColumn(column.key);
              }}
            >
              <Checkbox
                checked={column.enabled}
                onCheckedChange={() => onToggleColumn(column.key)}
                className="pointer-events-none"
              />
              <span className="text-sm">{column.label}</span>
            </DropdownMenuItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};