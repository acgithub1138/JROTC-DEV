import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Clock, User, Package } from 'lucide-react';
import { useInventoryHistory } from '../hooks/useInventoryHistory';
import { formatDistanceToNow } from 'date-fns';
import type { Tables } from '@/integrations/supabase/types';

type InventoryItem = Tables<'inventory_items'>;

interface InventoryHistoryDialogProps {
  item: InventoryItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const getFieldDisplayName = (fieldName: string) => {
  switch (fieldName) {
    case 'qty_total':
      return 'Total Quantity';
    case 'qty_issued':
      return 'Issued Quantity';
    case 'issued_to':
      return 'Issued To';
    default:
      return fieldName;
  }
};

const getFieldBadgeColor = (fieldName: string) => {
  switch (fieldName) {
    case 'qty_total':
      return 'bg-blue-100 text-blue-800';
    case 'qty_issued':
      return 'bg-orange-100 text-orange-800';
    case 'issued_to':
      return 'bg-purple-100 text-purple-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const InventoryHistoryDialog: React.FC<InventoryHistoryDialogProps> = ({
  item,
  open,
  onOpenChange,
}) => {
  const { data: history, isLoading } = useInventoryHistory(item?.id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            History: {item?.item}
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh]">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-pulse text-muted-foreground">Loading history...</div>
            </div>
          ) : !history || history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Clock className="w-8 h-8 mb-2" />
              <span>No history available</span>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((entry) => (
                <div key={entry.id} className="border rounded-lg p-4 bg-card">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge className={getFieldBadgeColor(entry.field_name)}>
                        {getFieldDisplayName(entry.field_name)}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    {entry.profiles && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <User className="w-3 h-3" />
                        {entry.profiles.first_name} {entry.profiles.last_name}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Changed from:</span>
                    <code className="bg-muted px-2 py-1 rounded text-xs">
                      {entry.old_value || 'empty'}
                    </code>
                    <span className="text-muted-foreground">to:</span>
                    <code className="bg-muted px-2 py-1 rounded text-xs">
                      {entry.new_value || 'empty'}
                    </code>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};