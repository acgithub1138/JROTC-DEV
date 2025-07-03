import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SortableTableHead } from '@/components/ui/sortable-table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Edit, Trash2, Package, AlertTriangle } from 'lucide-react';
import { useSortableTable } from '@/hooks/useSortableTable';
import { EditInventoryItemDialog } from './EditInventoryItemDialog';
import type { Tables } from '@/integrations/supabase/types';

type InventoryItem = Tables<'inventory_items'>;

interface InventoryTableProps {
  items: InventoryItem[];
  isLoading: boolean;
  selectedItems: string[];
  visibleColumns: string[];
  onSelectionChange: (selectedIds: string[]) => void;
  onEdit: (item: any) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export const InventoryTable: React.FC<InventoryTableProps> = ({
  items,
  isLoading,
  selectedItems,
  visibleColumns,
  onSelectionChange,
  onEdit,
  onDelete,
}) => {
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  
  const { sortedData: sortedItems, sortConfig, handleSort } = useSortableTable({
    data: items
  });

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item);
  };

  const handleEditSubmit = async (updatedItem: any) => {
    await onEdit(updatedItem);
    setEditingItem(null);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(sortedItems.map(item => item.id));
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectItem = (itemId: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedItems, itemId]);
    } else {
      onSelectionChange(selectedItems.filter(id => id !== itemId));
    }
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

  const isColumnVisible = (columnKey: string) => visibleColumns.includes(columnKey);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center py-12">
          <Package className="w-8 h-8 text-gray-400 animate-pulse" />
          <span className="ml-2 text-gray-500">Loading inventory...</span>
        </div>
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
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedItems.length === sortedItems.length && sortedItems.length > 0}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              {isColumnVisible('item_id') && (
                <SortableTableHead sortKey="item_id" currentSort={sortConfig} onSort={handleSort}>
                  Item ID
                </SortableTableHead>
              )}
              {isColumnVisible('item') && (
                <SortableTableHead sortKey="item" currentSort={sortConfig} onSort={handleSort}>
                  Item
                </SortableTableHead>
              )}
              {isColumnVisible('category') && (
                <SortableTableHead sortKey="category" currentSort={sortConfig} onSort={handleSort}>
                  Category
                </SortableTableHead>
              )}
              {isColumnVisible('sub_category') && (
                <SortableTableHead sortKey="sub_category" currentSort={sortConfig} onSort={handleSort}>
                  Sub Category
                </SortableTableHead>
              )}
              {isColumnVisible('size') && (
                <SortableTableHead sortKey="size" currentSort={sortConfig} onSort={handleSort}>
                  Size
                </SortableTableHead>
              )}
              {isColumnVisible('gender') && (
                <SortableTableHead sortKey="gender" currentSort={sortConfig} onSort={handleSort}>
                  Gender
                </SortableTableHead>
              )}
              {isColumnVisible('qty_total') && (
                <SortableTableHead sortKey="qty_total" currentSort={sortConfig} onSort={handleSort}>
                  Total Qty
                </SortableTableHead>
              )}
              {isColumnVisible('qty_issued') && (
                <SortableTableHead sortKey="qty_issued" currentSort={sortConfig} onSort={handleSort}>
                  Issued Qty
                </SortableTableHead>
              )}
              {isColumnVisible('qty_available') && (
                <SortableTableHead sortKey="qty_available" currentSort={sortConfig} onSort={handleSort}>
                  Available Qty
                </SortableTableHead>
              )}
              {isColumnVisible('status') && (
                <TableHead>Status</TableHead>
              )}
              {isColumnVisible('stock_number') && (
                <SortableTableHead sortKey="stock_number" currentSort={sortConfig} onSort={handleSort}>
                  Stock Number
                </SortableTableHead>
              )}
              {isColumnVisible('unit_of_measure') && (
                <SortableTableHead sortKey="unit_of_measure" currentSort={sortConfig} onSort={handleSort}>
                  Unit
                </SortableTableHead>
              )}
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={visibleColumns.length + 2} className="text-center py-12">
                  <div className="flex flex-col items-center text-gray-500">
                    <Package className="w-12 h-12 mb-2" />
                    <span className="text-lg font-medium">No inventory items found</span>
                    <span className="text-sm">Start by adding your first inventory item</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              sortedItems.map((item) => (
                <TableRow key={item.id} className="hover:bg-gray-50">
                  <TableCell>
                    <Checkbox
                      checked={selectedItems.includes(item.id)}
                      onCheckedChange={(checked) => handleSelectItem(item.id, !!checked)}
                  />
                  </TableCell>
                  {isColumnVisible('item_id') && (
                    <TableCell className="font-medium">{item.item_id}</TableCell>
                  )}
                  {isColumnVisible('item') && (
                    <TableCell className="font-medium">{item.item}</TableCell>
                  )}
                  {isColumnVisible('category') && (
                    <TableCell>{item.category}</TableCell>
                  )}
                  {isColumnVisible('sub_category') && (
                    <TableCell>{item.sub_category}</TableCell>
                  )}
                  {isColumnVisible('size') && (
                    <TableCell>{item.size}</TableCell>
                  )}
                  {isColumnVisible('gender') && (
                    <TableCell>{getGenderBadge(item.gender)}</TableCell>
                  )}
                  {isColumnVisible('qty_total') && (
                    <TableCell>{item.qty_total}</TableCell>
                  )}
                  {isColumnVisible('qty_issued') && (
                    <TableCell>{item.qty_issued}</TableCell>
                  )}
                  {isColumnVisible('qty_available') && (
                    <TableCell className="font-medium">{item.qty_available}</TableCell>
                  )}
                  {isColumnVisible('status') && (
                    <TableCell>{getAvailabilityStatus(item)}</TableCell>
                  )}
                  {isColumnVisible('stock_number') && (
                    <TableCell>{item.stock_number}</TableCell>
                  )}
                  {isColumnVisible('unit_of_measure') && (
                    <TableCell>{getUnitOfMeasureBadge(item.unit_of_measure)}</TableCell>
                  )}
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(item)}
                        title="Edit item"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(item.id)}
                        title="Delete item"
                        className="hover:text-red-600"
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