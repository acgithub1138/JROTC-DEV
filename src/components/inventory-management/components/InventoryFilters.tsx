import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface InventoryFiltersProps {
  showOutOfStockOnly: boolean;
  onShowOutOfStockChange: (checked: boolean) => void;
}

export const InventoryFilters: React.FC<InventoryFiltersProps> = ({
  showOutOfStockOnly,
  onShowOutOfStockChange
}) => {
  return (
    <div className="flex items-center gap-2">
      <Switch 
        checked={showOutOfStockOnly} 
        onCheckedChange={onShowOutOfStockChange} 
        id="out-of-stock-toggle" 
      />
      <Label htmlFor="out-of-stock-toggle" className="text-sm">
        Show Out of Stock Items Only
      </Label>
    </div>
  );
};