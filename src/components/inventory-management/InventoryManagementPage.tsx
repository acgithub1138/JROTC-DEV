import React, { useState } from 'react';
import { InventoryTable } from './components/InventoryTable';
import { AddInventoryItemDialog } from './components/AddInventoryItemDialog';
import { EditInventoryItemDialog } from './components/EditInventoryItemDialog';
import { DeleteInventoryDialog } from './components/DeleteInventoryDialog';
import { BulkOperationsDialog } from './components/BulkOperationsDialog';
import { InventoryActions } from './components/InventoryActions';
import { InventoryFilters } from './components/InventoryFilters';
import { StockCounter } from './components/StockCounter';
import { TablePagination } from '@/components/ui/table-pagination';
import { StandardTableWrapper } from '@/components/ui/standard-table';
import { useInventoryItems } from './hooks/useInventoryItems';
import { useInventoryFilters } from './hooks/useInventoryFilters';
import { useToast } from '@/hooks/use-toast';
import { getPaginatedItems, getTotalPages } from '@/utils/pagination';
import { useColumnPreferences } from '@/hooks/useColumnPreferences';

const InventoryManagementPage = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [viewingItem, setViewingItem] = useState<any>(null);
  const [deletingItem, setDeletingItem] = useState<any>(null);
  const { toast } = useToast();

  // Define available columns for the inventory table
  const availableColumns = [
    { key: 'item_id', label: 'Item ID', enabled: true },
    { key: 'item', label: 'Item', enabled: true },
    { key: 'category', label: 'Category', enabled: true },
    { key: 'sub_category', label: 'Sub Category', enabled: true },
    { key: 'size', label: 'Size', enabled: false },
    { key: 'gender', label: 'Gender', enabled: false },
    { key: 'qty_total', label: 'Total Qty', enabled: true },
    { key: 'qty_issued', label: 'Issued Qty', enabled: false },
    { key: 'qty_available', label: 'Available Qty', enabled: true },
    { key: 'status', label: 'Status', enabled: true },
    { key: 'stock_number', label: 'Stock Number', enabled: false },
    { key: 'unit_of_measure', label: 'Unit', enabled: false }
  ];

  const { columns, enabledColumns, toggleColumn, isLoading: columnsLoading } = 
    useColumnPreferences('inventory', availableColumns);

  const { inventoryItems, isLoading, error, createItem, bulkCreateItems, updateItem, deleteItem } = 
    useInventoryItems();

  const { searchTerm, setSearchTerm, showOutOfStockOnly, setShowOutOfStockOnly, filteredItems } = 
    useInventoryFilters(inventoryItems);
  
  const totalPages = getTotalPages(filteredItems.length);
  const paginatedItems = getPaginatedItems(filteredItems, currentPage);
  
  // Calculate stock counts for filtered items
  const inStockCount = filteredItems.filter(item => (item.qty_available || 0) > 0).length;
  const outOfStockCount = filteredItems.filter(item => (item.qty_available || 0) <= 0).length;
  
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

  const handleViewItem = (item: any) => {
    setViewingItem(item);
  };
  const handleDeleteItem = (item: any) => {
    setDeletingItem(item);
  };

  const handleConfirmDelete = async () => {
    if (!deletingItem) return;
    
    try {
      await deleteItem(deletingItem.id);
      toast({
        title: "Success",
        description: "Inventory item deleted successfully"
      });
      setDeletingItem(null);
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
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Inventory Management</h1>
          <p className="text-muted-foreground">Manage school inventory items and assignments</p>
        </div>
        <div className="flex gap-2">
          <InventoryActions
            onAddItem={() => setIsAddDialogOpen(true)}
            onBulkOperations={() => setIsBulkDialogOpen(true)}
            onExport={exportToCSV}
          />
        </div>
      </div>

      <StandardTableWrapper
        title=""
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search by item, category, item ID, size, or stock number..."
        selectedCount={selectedItems.length}
        columns={columns}
        visibleColumns={enabledColumns.map(col => col.key)}
        onToggleColumn={toggleColumn}
        columnsLoading={columnsLoading}
        stockCounter={
          <StockCounter 
            inStockCount={inStockCount}
            outOfStockCount={outOfStockCount}
          />
        }
        extraControls={
          <InventoryFilters
            showOutOfStockOnly={showOutOfStockOnly}
            onShowOutOfStockChange={setShowOutOfStockOnly}
          />
        }
      >
        <InventoryTable items={paginatedItems as any} isLoading={isLoading} selectedItems={selectedItems} visibleColumns={enabledColumns.map(col => col.key)} onSelectionChange={setSelectedItems} onEdit={handleUpdateItem} onView={handleViewItem} onDelete={handleDeleteItem} />
      </StandardTableWrapper>

      <TablePagination currentPage={currentPage} totalPages={totalPages} totalItems={filteredItems.length} onPageChange={handlePageChange} />

      <AddInventoryItemDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} onSubmit={handleCreateItem} />

      <BulkOperationsDialog open={isBulkDialogOpen} onOpenChange={setIsBulkDialogOpen} onImport={handleBulkImport} />
      
      {viewingItem && (
        <EditInventoryItemDialog
          item={viewingItem}
          open={!!viewingItem}
          onOpenChange={(open) => !open && setViewingItem(null)}
          onSubmit={async () => {}}
          viewOnly={true}
        />
      )}

      <DeleteInventoryDialog 
        open={!!deletingItem} 
        onOpenChange={() => setDeletingItem(null)} 
        item={deletingItem} 
        onConfirm={handleConfirmDelete} 
        loading={false}
      />
    </div>;
};
export default InventoryManagementPage;