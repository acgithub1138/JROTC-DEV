import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Plus, Search, Download, Upload } from 'lucide-react';
import { InventoryTable } from './components/InventoryTable';
import { AddInventoryItemDialog } from './components/AddInventoryItemDialog';
import { BulkOperationsDialog } from './components/BulkOperationsDialog';
import { TablePagination } from '@/components/ui/table-pagination';
import { ColumnSelector } from '@/components/ui/column-selector';

import { useInventoryItems } from './hooks/useInventoryItems';
import { useToast } from '@/hooks/use-toast';
import { getPaginatedItems, getTotalPages } from '@/utils/pagination';
import { useColumnPreferences } from '@/hooks/useColumnPreferences';
const InventoryManagementPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showOutOfStockOnly, setShowOutOfStockOnly] = useState(false);
  const {
    toast
  } = useToast();

  // Define available columns for the inventory table
  const availableColumns = [{
    key: 'item_id',
    label: 'Item ID',
    enabled: true
  }, {
    key: 'item',
    label: 'Item',
    enabled: true
  }, {
    key: 'category',
    label: 'Category',
    enabled: true
  }, {
    key: 'sub_category',
    label: 'Sub Category',
    enabled: true
  }, {
    key: 'size',
    label: 'Size',
    enabled: false
  }, {
    key: 'gender',
    label: 'Gender',
    enabled: false
  }, {
    key: 'qty_total',
    label: 'Total Qty',
    enabled: true
  }, {
    key: 'qty_issued',
    label: 'Issued Qty',
    enabled: false
  }, {
    key: 'qty_available',
    label: 'Available Qty',
    enabled: true
  }, {
    key: 'status',
    label: 'Status',
    enabled: true
  }, {
    key: 'stock_number',
    label: 'Stock Number',
    enabled: false
  }, {
    key: 'unit_of_measure',
    label: 'Unit',
    enabled: false
  }];
  const {
    columns,
    enabledColumns,
    toggleColumn,
    isLoading: columnsLoading
  } = useColumnPreferences('inventory', availableColumns);
  const {
    inventoryItems,
    isLoading,
    error,
    createItem,
    bulkCreateItems,
    updateItem,
    deleteItem
  } = useInventoryItems();
  const filteredItems = inventoryItems?.filter(item => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = item.item?.toLowerCase().includes(searchLower) || item.category?.toLowerCase().includes(searchLower) || item.sub_category?.toLowerCase().includes(searchLower) || item.item_id?.toLowerCase().includes(searchLower) || item.size?.toLowerCase().includes(searchLower) || item.stock_number?.toLowerCase().includes(searchLower);
    const matchesOutOfStock = showOutOfStockOnly ? (item.qty_available || 0) <= 0 : true;
    return matchesSearch && matchesOutOfStock;
  }) || [];
  const totalPages = getTotalPages(filteredItems.length);
  const paginatedItems = getPaginatedItems(filteredItems, currentPage);
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Reset to first page when search changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);
  const handleCreateItem = async (item: any) => {
    try {
      await createItem(item);
      toast({
        title: "Success",
        description: "Inventory item created successfully"
      });
      setIsAddDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create inventory item",
        variant: "destructive"
      });
    }
  };
  const handleUpdateItem = async (item: any) => {
    try {
      await updateItem(item);
      toast({
        title: "Success",
        description: "Inventory item updated successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update inventory item",
        variant: "destructive"
      });
    }
  };
  const handleDeleteItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this inventory item?')) {
      return;
    }
    try {
      await deleteItem(id);
      toast({
        title: "Success",
        description: "Inventory item deleted successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete inventory item",
        variant: "destructive"
      });
    }
  };
  const handleBulkImport = async (items: any[]) => {
    // Import items in bulk for better performance
    await bulkCreateItems(items);
  };
  const exportToCSV = () => {
    if (!filteredItems.length) {
      toast({
        title: "No Data",
        description: "No inventory items to export",
        variant: "destructive"
      });
      return;
    }
    const headers = ['Item ID', 'Item', 'Category', 'Sub Category', 'Size', 'Gender', 'Total Qty', 'Issued Qty', 'Available Qty', 'Stock Number', 'Unit'];
    const csvContent = [headers.join(','), ...filteredItems.map(item => [item.item_id || '', item.item || '', item.category || '', item.sub_category || '', item.size || '', item.gender || '', item.qty_total || 0, item.qty_issued || 0, item.qty_available || 0, item.stock_number || '', item.unit_of_measure || ''].join(','))].join('\n');
    const blob = new Blob([csvContent], {
      type: 'text/csv'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({
      title: "Success",
      description: "Inventory data exported successfully"
    });
  };
  if (error) {
    return <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-red-800 mb-2">Error Loading Inventory</h2>
          <p className="text-red-600">Failed to load inventory items. Please try again later.</p>
        </div>
      </div>;
  }
  return <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Inventory Management</h1>
          <p className="text-gray-600">Manage school inventory items and assignments</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportToCSV}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={() => setIsBulkDialogOpen(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Bulk Operations
          </Button>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Item
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input placeholder="Search by item, category, item ID, size, or stock number..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
        </div>
        
        <div className="flex items-center gap-4 ml-4">
          <div className="flex items-center gap-2">
            <Switch checked={showOutOfStockOnly} onCheckedChange={setShowOutOfStockOnly} id="out-of-stock-toggle" />
            <Label htmlFor="out-of-stock-toggle" className="text-sm">Show Out of Stock Items</Label>
          </div>
          
          <ColumnSelector columns={columns} onToggleColumn={toggleColumn} isLoading={columnsLoading} />
          {selectedItems.length > 0 && <>
              <span className="text-sm text-gray-600">
                {selectedItems.length} selected
              </span>
              <Button size="sm" variant="outline">
                Bulk Edit
              </Button>
            </>}
        </div>
      </div>

      <InventoryTable items={paginatedItems} isLoading={isLoading} selectedItems={selectedItems} visibleColumns={enabledColumns.map(col => col.key)} onSelectionChange={setSelectedItems} onEdit={handleUpdateItem} onDelete={handleDeleteItem} />

      <TablePagination currentPage={currentPage} totalPages={totalPages} totalItems={filteredItems.length} onPageChange={handlePageChange} />

      <AddInventoryItemDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} onSubmit={handleCreateItem} />

      <BulkOperationsDialog open={isBulkDialogOpen} onOpenChange={setIsBulkDialogOpen} onImport={handleBulkImport} />
    </div>;
};
export default InventoryManagementPage;