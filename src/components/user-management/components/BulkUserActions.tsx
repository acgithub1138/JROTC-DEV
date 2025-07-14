import { Button } from '@/components/ui/button';
import { UserX, UserPlus } from 'lucide-react';

interface BulkUserActionsProps {
  selectedCount: number;
  activeTab: 'active' | 'disabled';
  onBulkAction: () => void;
}

export const BulkUserActions = ({ selectedCount, activeTab, onBulkAction }: BulkUserActionsProps) => {
  if (selectedCount === 0) return null;

  return (
    <div className={`flex items-center justify-between p-3 rounded-lg mb-4 ${
      activeTab === 'active' ? 'bg-blue-50' : 'bg-green-50'
    }`}>
      <span className="text-sm font-medium">
        {selectedCount} user{selectedCount > 1 ? 's' : ''} selected
      </span>
      <Button
        variant={activeTab === 'active' ? 'destructive' : 'default'}
        size="sm"
        onClick={onBulkAction}
      >
        {activeTab === 'active' ? (
          <>
            <UserX className="w-4 h-4 mr-2" />
            Disable Selected
          </>
        ) : (
          <>
            <UserPlus className="w-4 h-4 mr-2" />
            Enable Selected
          </>
        )}
      </Button>
    </div>
  );
};