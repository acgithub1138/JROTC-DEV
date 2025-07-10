
import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ChevronDown, Trash2 } from 'lucide-react';

interface TableHeaderProps {
  selectedTasks: string[];
  totalTasks: number;
  onSelectAll: (checked: boolean) => void;
  onBulkDelete: () => void;
  canEdit: boolean;
  showOverdueFilter?: boolean;
  overdueFilterChecked?: boolean;
  onOverdueFilterChange?: (checked: boolean) => void;
}

export const TableHeader: React.FC<TableHeaderProps> = ({
  selectedTasks,
  totalTasks,
  onSelectAll,
  onBulkDelete,
  canEdit,
  showOverdueFilter = false,
  overdueFilterChecked = false,
  onOverdueFilterChange
}) => {
  return (
    <div className="flex items-center justify-between p-4 border-b">
      <div className="flex items-center gap-2">
        <Checkbox
          checked={selectedTasks.length === totalTasks && totalTasks > 0}
          onCheckedChange={onSelectAll}
        />
        <span className="text-sm text-gray-600">
          {selectedTasks.length > 0 ? `${selectedTasks.length} selected` : 'Select all'}
        </span>
      </div>
      <div className="flex items-center gap-4">
        {showOverdueFilter && (
          <div className="flex items-center gap-2">
            <Checkbox
              checked={overdueFilterChecked}
              onCheckedChange={onOverdueFilterChange}
            />
            <span className="text-sm text-gray-600">Show overdue only</span>
          </div>
        )}
        {selectedTasks.length > 0 && canEdit && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Actions <ChevronDown className="w-4 h-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-white">
              <DropdownMenuItem 
                onClick={onBulkDelete}
                className="text-red-600"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Selected
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
};
