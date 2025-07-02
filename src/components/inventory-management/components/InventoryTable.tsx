import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2 } from 'lucide-react';
import { EditInventoryItemDialog } from './EditInventoryItemDialog';
import type { Tables } from '@/integrations/supabase/types';

type InventoryItem = Tables<'inventory_items'>;

interface InventoryTableProps {
  items: InventoryItem[];
  isLoading: boolean;
  onEdit: (item: any) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export const InventoryTable: React.FC<InventoryTableProps> = ({
  items,
  isLoading,
  onEdit,
  onDelete,
}) => {
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item);
  };

  const handleEditSubmit = async (updatedItem: any) => {
    await onEdit(updatedItem);
    setEditingItem(null);
  };

  const getGenderBadge = (gender: string | null) => {
    if (!gender) return null;
    return (
      <Badge variant="outline" className="text-xs">
        {gender}
      </Badge>
    );
  };

  const getUnitOfMeasureBadge = (unit: string | null) => {
    if (!unit) return null;
    return (
      <Badge variant="outline" className="text-xs">
        {unit}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item ID</TableHead>
              <TableHead>Item</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Sub Category</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Gender</TableHead>
              <TableHead>Total Qty</TableHead>
              <TableHead>Issued Qty</TableHead>
              <TableHead>Available Qty</TableHead>
              <TableHead>Stock Number</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={12} className="text-center py-8 text-gray-500">
                  No inventory items found
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.item_id}</TableCell>
                  <TableCell>{item.item}</TableCell>
                  <TableCell>{item.category}</TableCell>
                  <TableCell>{item.sub_category}</TableCell>
                  <TableCell>{item.size}</TableCell>
                  <TableCell>{getGenderBadge(item.gender)}</TableCell>
                  <TableCell>{item.qty_total}</TableCell>
                  <TableCell>{item.qty_issued}</TableCell>
                  <TableCell className="font-medium">{item.qty_available}</TableCell>
                  <TableCell>{item.stock_number}</TableCell>
                  <TableCell>{getUnitOfMeasureBadge(item.unit_of_measure)}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(item)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(item.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {editingItem && (
        <EditInventoryItemDialog
          item={editingItem}
          open={!!editingItem}
          onOpenChange={(open) => !open && setEditingItem(null)}
          onSubmit={handleEditSubmit}
        />
      )}
    </>
  );
};