import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

type InventoryItem = Tables<'inventory_items'>;

interface InventoryStatsProps {
  items: InventoryItem[];
  isLoading: boolean;
}

export const InventoryStats: React.FC<InventoryStatsProps> = ({ items, isLoading }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-gray-100 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  const totalItems = items.length;
  const totalQuantity = items.reduce((sum, item) => sum + (item.qty_total || 0), 0);
  const totalIssued = items.reduce((sum, item) => sum + (item.qty_issued || 0), 0);
  const totalAvailable = items.reduce((sum, item) => sum + (item.qty_available || 0), 0);
  
  const lowStockItems = items.filter(item => {
    const available = item.qty_available || 0;
    const total = item.qty_total || 0;
    return available <= total * 0.2 && available > 0;
  }).length;

  const outOfStockItems = items.filter(item => (item.qty_available || 0) === 0).length;

  const categories = new Set(items.map(item => item.category).filter(Boolean)).size;

  const utilizationRate = totalQuantity > 0 ? (totalIssued / totalQuantity * 100).toFixed(1) : '0';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Items</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalItems}</div>
          <p className="text-xs text-muted-foreground">
            {categories} categories
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Quantity</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalQuantity.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            {totalAvailable.toLocaleString()} available
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Utilization Rate</CardTitle>
          <TrendingDown className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{utilizationRate}%</div>
          <p className="text-xs text-muted-foreground">
            {totalIssued.toLocaleString()} issued
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Stock Alerts</CardTitle>
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Badge variant="destructive" className="text-xs">
              {outOfStockItems} out
            </Badge>
            <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">
              {lowStockItems} low
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Stock status
          </p>
        </CardContent>
      </Card>
    </div>
  );
};