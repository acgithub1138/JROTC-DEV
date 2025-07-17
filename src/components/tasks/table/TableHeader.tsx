import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { BulkTaskActions } from './BulkTaskActions';
interface TableHeaderProps {
  selectedTasks: string[];
  totalTasks: number;
  onSelectAll: (checked: boolean) => void;
  onSelectionClear: () => void;
  canEdit: boolean;
  canDelete: boolean;
  showOverdueFilter?: boolean;
  overdueFilterChecked?: boolean;
  onOverdueFilterChange?: (checked: boolean) => void;
  onRefresh?: () => void;
}
export const TableHeader: React.FC<TableHeaderProps> = ({
  selectedTasks,
  totalTasks,
  onSelectAll,
  onSelectionClear,
  canEdit,
  canDelete,
  showOverdueFilter = false,
  overdueFilterChecked = false,
  onOverdueFilterChange,
  onRefresh
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
        {onRefresh && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        )}
        <BulkTaskActions
          selectedTasks={selectedTasks}
          onSelectionClear={onSelectionClear}
          canEdit={canEdit}
          canDelete={canDelete}
        />
      </div>
    </div>;
};