import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTablePermissions } from '@/hooks/useTablePermissions';
import { IssuedUsersPopover } from './IssuedUsersPopover';
import type { Tables } from '@/integrations/supabase/types';
type InventoryItem = Tables<'inventory_items'>;
interface ViewInventoryItemDialogProps {
  item: InventoryItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (item: InventoryItem) => void;
}
export const ViewInventoryItemDialog: React.FC<ViewInventoryItemDialogProps> = ({
  item,
  open,
  onOpenChange,
  onEdit
}) => {
  const {
    canEdit: canUpdate
  } = useTablePermissions('inventory');
  if (!item) return null;
  const getGenderBadge = (gender: string | null) => {
    if (!gender) return <span className="text-muted-foreground">Not specified</span>;
    return <Badge variant="outline" className="text-xs">
        {gender}
      </Badge>;
  };
  const getUnitOfMeasureBadge = (unit: string | null) => {
    if (!unit) return <span className="text-muted-foreground">Not specified</span>;
    return <Badge variant="outline" className="text-xs">
        {unit}
      </Badge>;
  };
  const getAvailabilityStatus = (item: InventoryItem) => {
    const available = item.qty_available || 0;
    const total = item.qty_total || 0;
    if (available === 0) {
      return <Badge variant="destructive" className="text-xs">Out of Stock</Badge>;
    } else if (available <= total * 0.2) {
      return <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">Low Stock</Badge>;
    } else {
      return <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">In Stock</Badge>;
    }
  };
  const getBooleanBadge = (value: boolean | null) => {
    if (value === null || value === undefined) {
      return <span className="text-muted-foreground">Not specified</span>;
    }
    return <Badge variant={value ? "default" : "outline"} className="text-xs">
        {value ? "Yes" : "No"}
      </Badge>;
  };
  const handleEdit = () => {
    if (canUpdate && onEdit) {
      onEdit(item);
      onOpenChange(false);
    }
  };
  return <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Inventory Item Details</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-foreground border-b pb-2">
              Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Item ID</label>
                <p className="text-sm mt-1 font-medium">{item.item_id}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Item Name</label>
                <p className="text-sm mt-1">{item.item}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Category</label>
                <p className="text-sm mt-1">{item.category}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Sub Category</label>
                <p className="text-sm mt-1">{item.sub_category || <span className="text-muted-foreground">Not specified</span>}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Size</label>
                <p className="text-sm mt-1">{item.size || <span className="text-muted-foreground">Not specified</span>}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Gender</label>
                <div className="mt-1">{getGenderBadge(item.gender)}</div>
              </div>
            </div>
          </div>

          {/* Quantity Information */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-foreground border-b pb-2">
              Quantity Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Total Quantity</label>
                <p className="text-sm mt-1 font-medium">{item.qty_total || 0}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Issued Quantity</label>
                <p className="text-sm mt-1 font-medium">{item.qty_issued || 0}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Available Quantity</label>
                <p className="text-sm mt-1 font-medium">{item.qty_available || 0}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Status</label>
                <div className="mt-1">{getAvailabilityStatus(item)}</div>
              </div>
            </div>
          </div>

          {/* Item Details */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-foreground border-b pb-2">
              Item Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Stock Number</label>
                <p className="text-sm mt-1">{item.stock_number || <span className="text-muted-foreground">Not specified</span>}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Unit of Measure</label>
                <div className="mt-1">{getUnitOfMeasureBadge(item.unit_of_measure)}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Model Number</label>
                <p className="text-sm mt-1">{item.model_number || <span className="text-muted-foreground">Not specified</span>}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Has Serial Number</label>
                <div className="mt-1">{getBooleanBadge(item.has_serial_number)}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Returnable</label>
                <div className="mt-1">{getBooleanBadge(item.returnable)}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Accountable</label>
                <div className="mt-1">{getBooleanBadge(item.accountable)}</div>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-foreground border-b pb-2">
              Additional Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Condition</label>
                <p className="text-sm mt-1">{item.condition || <span className="text-muted-foreground">Not specified</span>}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Location</label>
                <p className="text-sm mt-1">{item.location || <span className="text-muted-foreground">Not specified</span>}</p>
              </div>
            </div>
            
            {item.description && <div className="mt-4">
                <label className="text-sm font-medium text-muted-foreground">Description</label>
                <p className="text-sm mt-1 whitespace-pre-wrap">{item.description}</p>
              </div>}
            
            {item.notes && <div className="mt-4">
                <label className="text-sm font-medium text-muted-foreground">Notes</label>
                <p className="text-sm mt-1 whitespace-pre-wrap">{item.notes}</p>
              </div>}

            {item.issued_to && item.issued_to.length > 0 && <div className="mt-4">
                <label className="text-sm font-medium text-muted-foreground">Issued To</label>
                <div className="mt-1">
                  <IssuedUsersPopover issuedTo={item.issued_to} />
                </div>
              </div>}
          </div>

          {/* Pending Operations */}
          {item.pending_updates || item.pending_issue_changes || item.pending_write_offs ? <div>
              <h3 className="text-lg font-semibold mb-3 text-foreground border-b pb-2">
                Pending Operations
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Pending Updates</label>
                  <p className="text-sm mt-1">{item.pending_updates || 0}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Pending Issue Changes</label>
                  <p className="text-sm mt-1">{item.pending_issue_changes || 0}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Pending Write Offs</label>
                  <p className="text-sm mt-1">{item.pending_write_offs || 0}</p>
                </div>
              </div>
            </div> : null}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {canUpdate && onEdit && <Button onClick={handleEdit}>
              Edit
            </Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>;
};