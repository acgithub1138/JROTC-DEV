import { Badge } from '@/components/ui/badge';

interface StockCounterProps {
  inStockCount: number;
  outOfStockCount: number;
}

export const StockCounter = ({ inStockCount, outOfStockCount }: StockCounterProps) => {
  return (
    <div className="flex items-center gap-2 text-sm">
      <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400">
        In Stock: {inStockCount}
      </Badge>
      <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">
        Out of Stock: {outOfStockCount}
      </Badge>
    </div>
  );
};