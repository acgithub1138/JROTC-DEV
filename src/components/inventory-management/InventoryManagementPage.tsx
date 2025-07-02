import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search } from 'lucide-react';
import { InventoryTable } from './components/InventoryTable';
import { AddInventoryItemDialog } from './components/AddInventoryItemDialog';
import { useInventoryItems } from './hooks/useInventoryItems';

const InventoryManagementPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  
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

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
          <p className="text-gray-600">Manage school inventory items and assignments</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Item
        </Button>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search by item, category, item ID, size, or stock number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <InventoryTable
        items={filteredItems}
        isLoading={isLoading}
        onEdit={async (item) => { await updateItem(item); }}
        onDelete={async (id) => { await deleteItem(id); }}
      />

      <AddInventoryItemDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSubmit={async (item) => { await createItem(item); }}
      />
    </div>
  );
};

export default InventoryManagementPage;