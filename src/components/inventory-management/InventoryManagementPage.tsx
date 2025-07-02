import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Download, Upload } from 'lucide-react';
import { InventoryTable } from './components/InventoryTable';
import { AddInventoryItemDialog } from './components/AddInventoryItemDialog';
import { BulkOperationsDialog } from './components/BulkOperationsDialog';

import { useInventoryItems } from './hooks/useInventoryItems';
import { useToast } from '@/hooks/use-toast';

const InventoryManagementPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const { toast } = useToast();
  
  const {
    inventoryItems,
    isLoading,
    error,
    createItem,
    updateItem,
    deleteItem
  } = useInventoryItems();

  const filteredItems = inventoryItems?.filter(item => {
    const searchLower = searchTerm.toLowerCase();
    return (
      item.item?.toLowerCase().includes(searchLower) ||
      item.category?.toLowerCase().includes(searchLower) ||
      item.sub_category?.toLowerCase().includes(searchLower) ||
      item.item_id?.toLowerCase().includes(searchLower) ||
      item.size?.toLowerCase().includes(searchLower) ||
      item.stock_number?.toLowerCase().includes(searchLower)
    );
  }) || [];

  const handleCreateItem = async (item: any) => {
    try {
      await createItem(item);
      toast({
        title: "Success",
        description: "Inventory item created successfully",
      });
      setIsAddDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create inventory item",
        variant: "destructive",
      });
    }
  };

  const handleUpdateItem = async (item: any) => {
    try {
      await updateItem(item);
      toast({
        title: "Success",
        description: "Inventory item updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update inventory item",
        variant: "destructive",
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
        description: "Inventory item deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete inventory item",
        variant: "destructive",
      });
    }
  };

  const exportToCSV = () => {
    if (!filteredItems.length) {
      toast({
        title: "No Data",
        description: "No inventory items to export",
        variant: "destructive",
      });
      return;
    }

    const headers = [
      'Item ID', 'Item', 'Category', 'Sub Category', 'Size', 'Gender',
      'Total Qty', 'Issued Qty', 'Available Qty', 'Stock Number', 'Unit'
    ];

    const csvContent = [
      headers.join(','),
      ...filteredItems.map(item => [
        item.item_id || '',
        item.item || '',
        item.category || '',
        item.sub_category || '',
        item.size || '',
        item.gender || '',
        item.qty_total || 0,
        item.qty_issued || 0,
        item.qty_available || 0,
        item.stock_number || '',
        item.unit_of_measure || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Success",
      description: "Inventory data exported successfully",
    });
  };

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-red-800 mb-2">Error Loading Inventory</h2>
          <p className="text-red-600">Failed to load inventory items. Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
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
          <Input
            placeholder="Search by item, category, item ID, size, or stock number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        {selectedItems.length > 0 && (
          <div className="flex items-center gap-2 ml-4">
            <span className="text-sm text-gray-600">
              {selectedItems.length} selected
            </span>
            <Button size="sm" variant="outline">
              Bulk Edit
            </Button>
          </div>
        )}
      </div>

      <InventoryTable
        items={filteredItems}
        isLoading={isLoading}
        selectedItems={selectedItems}
        onSelectionChange={setSelectedItems}
        onEdit={handleUpdateItem}
        onDelete={handleDeleteItem}
      />

      <AddInventoryItemDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSubmit={handleCreateItem}
      />

      <BulkOperationsDialog
        open={isBulkDialogOpen}
        onOpenChange={setIsBulkDialogOpen}
        onImport={handleCreateItem}
      />
    </div>
  );
};

export default InventoryManagementPage;