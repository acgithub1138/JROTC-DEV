import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { BulkTaskActions } from './BulkTaskActions';
interface TableHeaderProps {
  selectedTasks: string[];
  totalTasks: number;
  onSelectAll: (checked: boolean) => void;
  onSelectionClear: () => void;
  canEdit: boolean;
  showOverdueFilter?: boolean;
  overdueFilterChecked?: boolean;
  onOverdueFilterChange?: (checked: boolean) => void;
}
export const TableHeader: React.FC<TableHeaderProps> = ({
  selectedTasks,
  totalTasks,
  onSelectAll,
  onSelectionClear,
  canEdit,
  showOverdueFilter = false,
  overdueFilterChecked = false,
  onOverdueFilterChange
}) => {
  return <div className="flex items-center justify-between p-4 border-b">
      <div className="flex items-center gap-2">
        <Checkbox checked={selectedTasks.length === totalTasks && totalTasks > 0} onCheckedChange={onSelectAll} />
        <span className="text-sm text-gray-600">
          {selectedTasks.length > 0 ? `${selectedTasks.length} selected` : 'Select all'}
        </span>
      </div>
      <div className="flex items-center gap-4">
        {showOverdueFilter && <div className="flex items-center gap-2">
            <Checkbox checked={overdueFilterChecked} onCheckedChange={onOverdueFilterChange} />
            <span className="text-sm text-gray-600">Overdue Tasks</span>
          </div>}
        <BulkTaskActions
          selectedTasks={selectedTasks}
          onSelectionClear={onSelectionClear}
          canEdit={canEdit}
        />
      </div>
    </div>;
};