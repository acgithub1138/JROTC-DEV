import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { InventoryTable } from './components/InventoryTable';
import { EditInventoryItemDialog } from './components/EditInventoryItemDialog';
import { DeleteInventoryDialog } from './components/DeleteInventoryDialog';
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
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
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

  const { inventoryItems, isLoading, error, updateItem, deleteItem } = 
    useInventoryItems();

  const { searchTerm, setSearchTerm, showOutOfStockOnly, setShowOutOfStockOnly, filteredItems } = 
    useInventoryFilters(inventoryItems || []);

  // Pagination - will be applied AFTER sorting in InventoryTable
  const totalPages = getTotalPages((filteredItems || []).length);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Calculate stock counts
  const inStockCount = (inventoryItems || []).filter(item => (item.qty_available || 0) > 0).length;
  const outOfStockCount = (inventoryItems || []).filter(item => (item.qty_available || 0) === 0).length;

  // Handle navigation for create/edit
  const handleCreateNew = () => {
    navigate('/app/inventory/inventory_record?mode=create');
  };

  const handleEditItem = async (item: any) => {
    navigate(`/app/inventory/inventory_record?mode=edit&id=${item.id}`);
  };

  const handleViewItem = (item: any) => {
    navigate(`/app/inventory/inventory_record?id=${item.id}`);
  };

  const handleDeleteItem = (item: any) => {
    setDeletingItem(item);
  };

  const handleConfirmDelete = async () => {
    if (deletingItem) {
      try {
        await deleteItem(deletingItem.id);
        setDeletingItem(null);
        toast({
          title: "Success",
          description: "Inventory item deleted successfully"
        });
      } catch (error) {
        console.error('Error deleting item:', error);
        toast({
          title: "Error",
          description: "Failed to delete inventory item",
          variant: "destructive"
        });
      }
    }
  };

  const handleExport = () => {
    const safeFilteredItems = filteredItems || [];
    if (!safeFilteredItems.length) {
      toast({
        title: "No Data",
        description: "No inventory items to export",
        variant: "destructive"
      });
      return;
    }
    const headers = ['Item ID', 'Item', 'Category', 'Sub Category', 'Size', 'Gender', 'Total Qty', 'Issued Qty', 'Available Qty', 'Stock Number', 'Unit'];
    const csvContent = [headers.join(','), ...safeFilteredItems.map(item => [item.item_id || '', item.item || '', item.category || '', item.sub_category || '', item.size || '', item.gender || '', item.qty_total || 0, item.qty_issued || 0, item.qty_available || 0, item.stock_number || '', item.unit_of_measure || ''].join(','))].join('\n');
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
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-red-800 mb-2">Error Loading Inventory</h2>
          <p className="text-red-600">Failed to load inventory items. Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">Inventory Management</h1>
            <p className="text-muted-foreground">Manage school inventory items and assignments</p>
          </div>
          {/* Desktop actions */}
          <div className="hidden sm:flex gap-2">
            <InventoryActions
              onAddItem={handleCreateNew}
              onExport={handleExport}
            />
          </div>
        </div>

        {/* Mobile actions - Below header */}
        <div className="sm:hidden">
          <InventoryActions
            onAddItem={handleCreateNew}
            onExport={handleExport}
          />
        </div>
      </div>

      <StandardTableWrapper
        title="Inventory Items"
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search inventory items..."
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
        <InventoryTable 
          items={filteredItems as any}
          currentPage={currentPage}
          isLoading={isLoading} 
          selectedItems={selectedItems} 
          visibleColumns={enabledColumns.map(col => col.key)} 
          onSelectionChange={setSelectedItems} 
          onEdit={handleEditItem} 
          onView={handleViewItem} 
          onDelete={handleDeleteItem} 
        />
      </StandardTableWrapper>

      <TablePagination 
        currentPage={currentPage} 
        totalPages={totalPages} 
        totalItems={(filteredItems || []).length} 
        onPageChange={handlePageChange} 
      />

      {viewingItem && (
        <EditInventoryItemDialog
          open={!!viewingItem}
          onOpenChange={() => setViewingItem(null)}
          item={viewingItem}
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
    </div>
  );
};

export default InventoryManagementPage;