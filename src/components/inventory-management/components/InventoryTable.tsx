import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { TableCell, TableHead, TableRow } from '@/components/ui/table';
import { SortableTableHead } from '@/components/ui/sortable-table';
import { StandardTable, StandardTableHeader, StandardTableBody } from '@/components/ui/standard-table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { TableActionButtons } from '@/components/ui/table-action-buttons';
import { Package, AlertTriangle, History } from 'lucide-react';
import { useSortableTable } from '@/hooks/useSortableTable';
import { useTableSettings } from '@/hooks/useTableSettings';
import { useInventoryTablePermissions } from '@/hooks/useOptimizedInventoryPermissions';
import { IssuedUsersPopover } from './IssuedUsersPopover';
import { InventoryHistoryDialog } from './InventoryHistoryDialog';
import { ViewInventoryItemDialog } from './ViewInventoryItemDialog';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getPaginatedItems } from '@/utils/pagination';
import type { Tables } from '@/integrations/supabase/types';
type InventoryItem = Tables<'inventory_items'>;
interface InventoryTableProps {
  items: InventoryItem[];
  currentPage: number;
  isLoading: boolean;
  selectedItems: string[];
  visibleColumns: string[];
  onSelectionChange: (selectedIds: string[]) => void;
  onEdit: (item: any) => Promise<void>;
  onView: (item: any) => void;
  onDelete: (item: any) => void;
}
export const InventoryTable: React.FC<InventoryTableProps> = ({
  items,
  currentPage,
  isLoading,
  selectedItems,
  visibleColumns,
  onSelectionChange,
  onEdit,
  onView,
  onDelete
}) => {
  const [viewingItem, setViewingItem] = useState<InventoryItem | null>(null);
  const [editingQty, setEditingQty] = useState<{
    itemId: string;
    field: 'qty_total' | 'qty_issued';
  } | null>(null);
  const [historyItem, setHistoryItem] = useState<InventoryItem | null>(null);
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const {
    getPaddingClass
  } = useTableSettings();
  const {
    canEdit: canUpdate,
    canDelete,
    canViewDetails
  } = useInventoryTablePermissions();
  // Sort items BEFORE pagination
  const {
    sortedData: sortedItems,
    sortConfig,
    handleSort
  } = useSortableTable({
    data: items,
    defaultSort: {
      key: 'category',
      direction: 'asc'
    }
  });
  
  // Paginate sorted items
  const paginatedItems = React.useMemo(() => 
    getPaginatedItems(sortedItems, currentPage),
    [sortedItems, currentPage]
  );
  const handleEdit = async (item: InventoryItem) => {
    if (!canUpdate) return;
    await onEdit(item);
  };
  const handleView = (item: InventoryItem) => {
    setViewingItem(item);
  };
  const handleEditSubmit = async (updatedItem: any) => {
    await onEdit(updatedItem);
  };
  const handleQtyEdit = async (itemId: string, field: 'qty_total' | 'qty_issued', value: string) => {
    if (!canUpdate) return;
    const numValue = parseInt(value) || 0;
    if (numValue < 0) return;
    const updatedItem = {
      id: itemId,
      [field]: numValue
    };
    await onEdit(updatedItem);
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
      onSelectionChange(paginatedItems.map(item => item.id));
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
    return <Badge variant="outline" className="text-xs">
        {gender}
      </Badge>;
  };
  const getUnitOfMeasureBadge = (unit: string | null) => {
    if (!unit) return null;
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
  const isColumnVisible = (columnKey: string) => visibleColumns.includes(columnKey);
  if (isLoading) {
    return <div className="space-y-4">
        <div className="flex items-center justify-center py-12">
          <Package className="w-8 h-8 text-gray-400 animate-pulse" />
          <span className="ml-2 text-gray-500">Loading inventory...</span>
        </div>
        {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />)}
      </div>;
  }

  // Mobile card view
  if (isMobile) {
    return (
      <>
        <div className="space-y-4">
          {paginatedItems.map(item => (
            <Card key={item.id} className="w-full max-w-full overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <Checkbox 
                      checked={selectedItems.includes(item.id)} 
                      onCheckedChange={checked => handleSelectItem(item.id, !!checked)} 
                      className="flex-shrink-0"
                    />
                    <CardTitle className="text-lg truncate">
                      {canViewDetails ? (
                        <button onClick={() => navigate(`/app/inventory/inventory_record?id=${item.id}`)} className="text-blue-600 hover:text-blue-800 cursor-pointer underline-offset-4 hover:underline text-left font-medium truncate block max-w-full">
                          {item.item_id}
                        </button>
                      ) : (
                        <span className="font-medium truncate block">{item.item_id}</span>
                      )}
                    </CardTitle>
                  </div>
                  <div className="flex flex-col gap-1 flex-shrink-0">
                    {getAvailabilityStatus(item)}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="min-w-0">
                  <h4 className="font-medium break-words">{item.item}</h4>
                  <p className="text-sm text-muted-foreground break-words">{item.category}</p>
                </div>
                
                {isColumnVisible('sub_category') && item.sub_category && (
                  <div className="min-w-0">
                    <span className="text-sm text-muted-foreground">Sub Category:</span>
                    <p className="text-sm break-words">{item.sub_category}</p>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {isColumnVisible('size') && item.size && (
                    <div className="min-w-0">
                      <span className="text-muted-foreground">Size:</span>
                      <p className="font-medium break-words">{item.size}</p>
                    </div>
                  )}
                  {isColumnVisible('gender') && item.gender && (
                    <div className="min-w-0">
                      <span className="text-muted-foreground">Gender:</span>
                      <p>{getGenderBadge(item.gender)}</p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-4 text-sm">
                  {isColumnVisible('qty_total') && (
                    <div className="min-w-0">
                      <span className="text-muted-foreground block text-xs">Total:</span>
                      <p className="font-medium">{item.qty_total || 0}</p>
                    </div>
                  )}
                  {isColumnVisible('qty_issued') && (
                    <div className="min-w-0">
                      <span className="text-muted-foreground block text-xs">Issued:</span>
                      <p className="font-medium">{item.qty_issued || 0}</p>
                    </div>
                  )}
                  {isColumnVisible('qty_available') && (
                    <div className="min-w-0">
                      <span className="text-muted-foreground block text-xs">Available:</span>
                      <p className="font-medium">{item.qty_available || 0}</p>
                    </div>
                  )}
                </div>

                {isColumnVisible('stock_number') && item.stock_number && (
                  <div className="text-sm min-w-0">
                    <span className="text-muted-foreground">Stock #:</span>
                    <span className="ml-1 break-all">{item.stock_number}</span>
                  </div>
                )}

                {isColumnVisible('unit_of_measure') && item.unit_of_measure && (
                  <div className="text-sm min-w-0">
                    <span className="text-muted-foreground">Unit:</span>
                    <span className="ml-1">{getUnitOfMeasureBadge(item.unit_of_measure)}</span>
                  </div>
                )}
                
                <div className="flex justify-between items-center pt-2 gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {item.issued_to && item.issued_to.length > 0 && canViewDetails && (
                      <IssuedUsersPopover issuedTo={item.issued_to} />
                    )}
                  </div>
                  <TableActionButtons 
                    canView={false} 
                    canEdit={canUpdate} 
                    canDelete={canDelete} 
                    onEdit={() => handleEdit(item)} 
                    onDelete={() => onDelete(item)} 
                    customActions={[{
                      icon: <History className="w-3 h-3" />,
                      label: "View history",
                      onClick: () => setHistoryItem(item),
                      show: canViewDetails
                    }]} 
                  />
                </div>
              </CardContent>
            </Card>
          ))}
          {paginatedItems.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No inventory items found
            </div>
          )}
        </div>

        <ViewInventoryItemDialog 
          item={viewingItem} 
          open={!!viewingItem} 
          onOpenChange={open => !open && setViewingItem(null)} 
          onEdit={async item => {
            await onEdit(item);
            setViewingItem(null);
          }} 
        />

        <InventoryHistoryDialog 
          item={historyItem} 
          open={!!historyItem} 
          onOpenChange={open => !open && setHistoryItem(null)} 
        />
      </>
    );
  }

  // Desktop table view
  return <>
      <StandardTable>
        <StandardTableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox checked={selectedItems.length === paginatedItems.length && paginatedItems.length > 0} onCheckedChange={handleSelectAll} />
            </TableHead>
            {isColumnVisible('item_id') && <SortableTableHead sortKey="item_id" currentSort={sortConfig} onSort={handleSort}>
                Item ID
              </SortableTableHead>}
            {isColumnVisible('item') && <SortableTableHead sortKey="item" currentSort={sortConfig} onSort={handleSort}>
                Item
              </SortableTableHead>}
            {isColumnVisible('category') && <SortableTableHead sortKey="category" currentSort={sortConfig} onSort={handleSort}>
                Category
              </SortableTableHead>}
            {isColumnVisible('sub_category') && <SortableTableHead sortKey="sub_category" currentSort={sortConfig} onSort={handleSort}>
                Sub Category
              </SortableTableHead>}
            {isColumnVisible('size') && <SortableTableHead sortKey="size" currentSort={sortConfig} onSort={handleSort}>
                Size
              </SortableTableHead>}
            {isColumnVisible('gender') && <SortableTableHead sortKey="gender" currentSort={sortConfig} onSort={handleSort}>
                Gender
              </SortableTableHead>}
            {isColumnVisible('qty_total') && <SortableTableHead sortKey="qty_total" currentSort={sortConfig} onSort={handleSort} className="w-20">
                Total
              </SortableTableHead>}
            {isColumnVisible('qty_issued') && <SortableTableHead sortKey="qty_issued" currentSort={sortConfig} onSort={handleSort} className="w-20">
                Issued
              </SortableTableHead>}
            {isColumnVisible('qty_available') && <SortableTableHead sortKey="qty_available" currentSort={sortConfig} onSort={handleSort} className="w-20">
                Available
              </SortableTableHead>}
            {isColumnVisible('status') && <TableHead>Status</TableHead>}
            {isColumnVisible('stock_number') && <SortableTableHead sortKey="stock_number" currentSort={sortConfig} onSort={handleSort}>
                Stock Number
              </SortableTableHead>}
            {isColumnVisible('unit_of_measure') && <SortableTableHead sortKey="unit_of_measure" currentSort={sortConfig} onSort={handleSort}>
                Unit
              </SortableTableHead>}
            <TableHead className="text-center">Actions</TableHead>
          </TableRow>
        </StandardTableHeader>
        <StandardTableBody emptyMessage="No inventory items found" emptyIcon={<Package className="w-12 h-12" />} colSpan={visibleColumns.length + 2}>
          {paginatedItems.map(item => <TableRow key={item.id} className="hover:bg-muted/50">
               <TableCell className={getPaddingClass()}>
                <Checkbox checked={selectedItems.includes(item.id)} onCheckedChange={checked => handleSelectItem(item.id, !!checked)} />
              </TableCell>
                   {isColumnVisible('item_id') && <TableCell className={`font-medium ${getPaddingClass()}`}>
                      {canViewDetails ? (
                        <button onClick={() => navigate(`/app/inventory/inventory_record?id=${item.id}`)} className="text-blue-600 hover:text-blue-800 cursor-pointer underline-offset-4 hover:underline text-left font-medium">
                          {item.item_id}
                        </button>
                      ) : (
                        <span className="font-medium">{item.item_id}</span>
                      )}
                    </TableCell>}
               {isColumnVisible('item') && <TableCell className={getPaddingClass()}>{item.item}</TableCell>}
               {isColumnVisible('category') && <TableCell className={getPaddingClass()}>{item.category}</TableCell>}
               {isColumnVisible('sub_category') && <TableCell className={getPaddingClass()}>{item.sub_category}</TableCell>}
               {isColumnVisible('size') && <TableCell className={getPaddingClass()}>{item.size}</TableCell>}
               {isColumnVisible('gender') && <TableCell className={getPaddingClass()}>{getGenderBadge(item.gender)}</TableCell>}
                {isColumnVisible('qty_total') && <TableCell className={getPaddingClass()}>
                    {editingQty?.itemId === item.id && editingQty?.field === 'qty_total' ? <Input type="number" defaultValue={item.qty_total?.toString() || '0'} className="w-16 h-8 text-sm" onBlur={e => {
              handleQtyEdit(item.id, 'qty_total', e.target.value);
              setEditingQty(null);
            }} onKeyDown={e => handleQtyKeyPress(e, item.id, 'qty_total')} autoFocus /> : <div className={`p-1 rounded ${canUpdate ? 'cursor-pointer hover:bg-muted' : ''}`} onClick={canUpdate ? () => setEditingQty({
              itemId: item.id,
              field: 'qty_total'
            }) : undefined}>
                         {item.qty_total || 0}
                       </div>}
                  </TableCell>}
                {isColumnVisible('qty_issued') && <TableCell className={getPaddingClass()}>
                    {editingQty?.itemId === item.id && editingQty?.field === 'qty_issued' ? <Input type="number" defaultValue={item.qty_issued?.toString() || '0'} className="w-16 h-8 text-sm" onBlur={e => {
              handleQtyEdit(item.id, 'qty_issued', e.target.value);
              setEditingQty(null);
            }} onKeyDown={e => handleQtyKeyPress(e, item.id, 'qty_issued')} autoFocus /> : <div className={`p-1 rounded ${canUpdate ? 'cursor-pointer hover:bg-muted' : ''}`} onClick={canUpdate ? () => setEditingQty({
              itemId: item.id,
              field: 'qty_issued'
            }) : undefined}>
                         {item.qty_issued || 0}
                       </div>}
                  </TableCell>}
               {isColumnVisible('qty_available') && <TableCell className={`font-medium ${getPaddingClass()}`}>{item.qty_available}</TableCell>}
               {isColumnVisible('status') && <TableCell className={getPaddingClass()}>{getAvailabilityStatus(item)}</TableCell>}
               {isColumnVisible('stock_number') && <TableCell className={getPaddingClass()}>{item.stock_number}</TableCell>}
               {isColumnVisible('unit_of_measure') && <TableCell className={getPaddingClass()}>{getUnitOfMeasureBadge(item.unit_of_measure)}</TableCell>}
                <TableCell className={getPaddingClass()}>
                  <div className="flex items-center justify-center gap-2">
                    {item.issued_to && item.issued_to.length > 0 && canViewDetails && <IssuedUsersPopover issuedTo={item.issued_to} />}
                     <TableActionButtons canView={false} canEdit={canUpdate} canDelete={canDelete} onEdit={() => handleEdit(item)} onDelete={() => onDelete(item)} customActions={[{
                icon: <History className="w-3 h-3" />,
                label: "View history",
                onClick: () => setHistoryItem(item),
                show: canViewDetails
              }]} />
                  </div>
              </TableCell>
            </TableRow>)}
        </StandardTableBody>
      </StandardTable>

      <ViewInventoryItemDialog item={viewingItem} open={!!viewingItem} onOpenChange={open => !open && setViewingItem(null)} onEdit={async item => {
      await onEdit(item);
      setViewingItem(null);
    }} />

      <InventoryHistoryDialog item={historyItem} open={!!historyItem} onOpenChange={open => !open && setHistoryItem(null)} />
    </>;
};