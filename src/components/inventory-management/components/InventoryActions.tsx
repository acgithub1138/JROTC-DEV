import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Plus, Download, Upload, MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useInventoryActionsPermissions } from '@/hooks/useOptimizedInventoryPermissions';
import { useIsMobile } from '@/hooks/use-mobile';

interface InventoryActionsProps {
  onAddItem: () => void;
  onExport: () => void;
}

export const InventoryActions: React.FC<InventoryActionsProps> = ({
  onAddItem,
  onExport
}) => {
  const navigate = useNavigate();
  const { canCreate, canBulkImport, isLoading } = useInventoryActionsPermissions();
  const isMobile = useIsMobile();

  const handleBulkOperations = () => {
    navigate('/app/inventory/inventory_bulk_upload');
  };

  return (
    <>
      {/* Desktop View */}
      {!isMobile && (
        <>
          {(canCreate || isLoading) && (
            <Button onClick={onAddItem} disabled={isLoading}>
              <Plus className="w-4 h-4 mr-2" />
              Add Item
            </Button>
          )}
          {(canBulkImport || isLoading) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center">
                  <MoreHorizontal className="w-4 h-4 mr-2" />
                  Actions
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48 bg-background border shadow-md z-50" align="end">
                <DropdownMenuItem onClick={onExport} className="flex items-center cursor-pointer">
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleBulkOperations} disabled={isLoading} className="flex items-center cursor-pointer">
                  <Upload className="w-4 h-4 mr-2" />
                  Bulk Import
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </>
      )}

      {/* Mobile View - 2 column grid with icon buttons */}
      {isMobile && (
        <div className="grid grid-cols-2 gap-2">
          {(canCreate || isLoading) && (
            <Button onClick={onAddItem} disabled={isLoading} className="w-full" size="lg">
              <Plus className="w-5 h-5" />
            </Button>
          )}
          {(canBulkImport || isLoading) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full" size="lg">
                  <MoreHorizontal className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48 bg-background border shadow-md z-50" align="end">
                <DropdownMenuItem onClick={onExport} className="flex items-center cursor-pointer">
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleBulkOperations} disabled={isLoading} className="flex items-center cursor-pointer">
                  <Upload className="w-4 h-4 mr-2" />
                  Bulk Import
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      )}
    </>
  );
};