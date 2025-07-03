import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SortableTableHead } from '@/components/ui/sortable-table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Edit, Trash2, Package, AlertTriangle, History } from 'lucide-react';
import { useSortableTable } from '@/hooks/useSortableTable';
import { useTableSettings } from '@/hooks/useTableSettings';
import { IssuedUsersPopover } from './IssuedUsersPopover';
import { EditInventoryItemDialog } from './EditInventoryItemDialog';
import { InventoryHistoryDialog } from './InventoryHistoryDialog';
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
  const [editingQty, setEditingQty] = useState<{itemId: string, field: 'qty_total' | 'qty_issued'} | null>(null);
  const [historyItem, setHistoryItem] = useState<InventoryItem | null>(null);
  const { getPaddingClass } = useTableSettings();
  
  const { sortedData: sortedItems, sortConfig, handleSort } = useSortableTable({
    data: items,
    defaultSort: { key: 'category', direction: 'asc' }
  });

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item);
  };

  const handleEditSubmit = async (updatedItem: any) => {
    await onEdit(updatedItem);
    setEditingItem(null);
  };

  const handleQtyEdit = (itemId: string, field: 'qty_total' | 'qty_issued', value: string) => {
    const numValue = parseInt(value) || 0;
    if (numValue < 0) return;
    
    const updatedItem = { 
      id: itemId, 
      [field]: numValue
    };
    onEdit(updatedItem);
  };

  const handleQtyKeyPress = (e: React.KeyboardEvent, itemId: string, field: 'qty_total' | 'qty_issued') => {
    if (e.key === 'Enter') {
      setEditingQty(null);
    }
    if (e.key === 'Escape') {
      setEditingQty(null);
    }
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
                <SortableTableHead sortKey="qty_total" currentSort={sortConfig} onSort={handleSort} className="w-20">
                  Total
                </SortableTableHead>
              )}
              {isColumnVisible('qty_issued') && (
                <SortableTableHead sortKey="qty_issued" currentSort={sortConfig} onSort={handleSort} className="w-20">
                  Issued
                </SortableTableHead>
              )}
              {isColumnVisible('qty_available') && (
                <SortableTableHead sortKey="qty_available" currentSort={sortConfig} onSort={handleSort} className="w-20">
                  Available
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
              <TableHead className="text-center">Actions</TableHead>
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
                   <TableCell className={getPaddingClass()}>
                    <Checkbox
                      checked={selectedItems.includes(item.id)}
                      onCheckedChange={(checked) => handleSelectItem(item.id, !!checked)}
                  />
                  </TableCell>
                   {isColumnVisible('item_id') && (
                     <TableCell className={`font-medium ${getPaddingClass()}`}>{item.item_id}</TableCell>
                   )}
                   {isColumnVisible('item') && (
                     <TableCell className={getPaddingClass()}>{item.item}</TableCell>
                   )}
                   {isColumnVisible('category') && (
                     <TableCell className={getPaddingClass()}>{item.category}</TableCell>
                   )}
                   {isColumnVisible('sub_category') && (
                     <TableCell className={getPaddingClass()}>{item.sub_category}</TableCell>
                   )}
                   {isColumnVisible('size') && (
                     <TableCell className={getPaddingClass()}>{item.size}</TableCell>
                   )}
                   {isColumnVisible('gender') && (
                     <TableCell className={getPaddingClass()}>{getGenderBadge(item.gender)}</TableCell>
                   )}
                    {isColumnVisible('qty_total') && (
                      <TableCell className={getPaddingClass()}>
                        {editingQty?.itemId === item.id && editingQty?.field === 'qty_total' ? (
                          <Input
                            type="number"
                            defaultValue={item.qty_total?.toString() || '0'}
                            className="w-16 h-8 text-sm"
                            onBlur={(e) => {
                              handleQtyEdit(item.id, 'qty_total', e.target.value);
                              setEditingQty(null);
                            }}
                            onKeyDown={(e) => handleQtyKeyPress(e, item.id, 'qty_total')}
                            autoFocus
                          />
                        ) : (
                          <div 
                            className="cursor-pointer hover:bg-gray-100 p-1 rounded"
                            onClick={() => setEditingQty({itemId: item.id, field: 'qty_total'})}
                          >
                            {item.qty_total || 0}
                          </div>
                        )}
                      </TableCell>
                    )}
                    {isColumnVisible('qty_issued') && (
                      <TableCell className={getPaddingClass()}>
                        {editingQty?.itemId === item.id && editingQty?.field === 'qty_issued' ? (
                          <Input
                            type="number"
                            defaultValue={item.qty_issued?.toString() || '0'}
                            className="w-16 h-8 text-sm"
                            onBlur={(e) => {
                              handleQtyEdit(item.id, 'qty_issued', e.target.value);
                              setEditingQty(null);
                            }}
                            onKeyDown={(e) => handleQtyKeyPress(e, item.id, 'qty_issued')}
                            autoFocus
                          />
                        ) : (
                          <div 
                            className="cursor-pointer hover:bg-gray-100 p-1 rounded"
                            onClick={() => setEditingQty({itemId: item.id, field: 'qty_issued'})}
                          >
                            {item.qty_issued || 0}
                          </div>
                        )}
                      </TableCell>
                    )}
                   {isColumnVisible('qty_available') && (
                     <TableCell className={`font-medium ${getPaddingClass()}`}>{item.qty_available}</TableCell>
                   )}
                   {isColumnVisible('status') && (
                     <TableCell className={getPaddingClass()}>{getAvailabilityStatus(item)}</TableCell>
                   )}
                   {isColumnVisible('stock_number') && (
                     <TableCell className={getPaddingClass()}>{item.stock_number}</TableCell>
                   )}
                   {isColumnVisible('unit_of_measure') && (
                     <TableCell className={getPaddingClass()}>{getUnitOfMeasureBadge(item.unit_of_measure)}</TableCell>
                   )}
                   <TableCell className={getPaddingClass()}>
                     <div className="flex items-center justify-end space-x-1">
                       {item.issued_to && item.issued_to.length > 0 && (
                         <IssuedUsersPopover issuedTo={item.issued_to} />
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setHistoryItem(item)}
                          title="View history"
                        >
                          <History className="w-4 h-4" />
                        </Button>
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

      <InventoryHistoryDialog
        item={historyItem}
        open={!!historyItem}
        onOpenChange={(open) => !open && setHistoryItem(null)}
      />
    </>
  );
};