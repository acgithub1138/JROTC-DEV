import { useState, useMemo } from 'react';

interface InventoryItem {
  id: string;
  item: string;
  category?: string;
  sub_category?: string;
  item_id?: string;
  size?: string;
  gender?: string;
  stock_number?: string;
  qty_available?: number;
  qty_total?: number;
  qty_issued?: number;
  unit_of_measure?: string;
  [key: string]: any; // Allow for additional properties
}

export const useInventoryFilters = (inventoryItems?: InventoryItem[]) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showOutOfStockOnly, setShowOutOfStockOnly] = useState(false);

  const filteredItems = useMemo(() => {
    if (!inventoryItems) return [];

    return inventoryItems.filter(item => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        item.item?.toLowerCase().includes(searchLower) ||
        item.category?.toLowerCase().includes(searchLower) ||
        item.sub_category?.toLowerCase().includes(searchLower) ||
        item.item_id?.toLowerCase().includes(searchLower) ||
        item.size?.toLowerCase().includes(searchLower) ||
        item.stock_number?.toLowerCase().includes(searchLower);

      const matchesOutOfStock = showOutOfStockOnly 
        ? (item.qty_available || 0) <= 0 
        : true;

      return matchesSearch && matchesOutOfStock;
    });
  }, [inventoryItems, searchTerm, showOutOfStockOnly]);

  return {
    searchTerm,
    setSearchTerm,
    showOutOfStockOnly,
    setShowOutOfStockOnly,
    filteredItems
  };
};