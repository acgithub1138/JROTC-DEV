import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Trash2 } from "lucide-react";
import { TableSettings } from "@/components/ui/table-settings";
import { ColumnSelector } from "@/components/ui/column-selector";
import { Table, TableBody, TableHeader } from "@/components/ui/table";
interface StandardTableWrapperProps {
  title: string;
  description?: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  selectedCount?: number;
  onBulkDelete?: () => void;
  columns?: any[];
  visibleColumns?: string[];
  onToggleColumn?: (columnKey: string) => void;
  columnsLoading?: boolean;
  extraControls?: React.ReactNode;
  stockCounter?: React.ReactNode;
}
export const StandardTableWrapper = React.forwardRef<HTMLDivElement, StandardTableWrapperProps>(({
  title,
  description,
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search...",
  children,
  actions,
  selectedCount = 0,
  onBulkDelete,
  columns,
  visibleColumns,
  onToggleColumn,
  columnsLoading,
  extraControls,
  stockCounter
}, ref) => <div ref={ref} className="space-y-6">
    {/* Header Section */}
    

    {/* Search and Controls Section */}
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative w-full sm:flex-1 sm:max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input placeholder={searchPlaceholder} value={searchValue} onChange={e => onSearchChange(e.target.value)} className="pl-10 w-full" />
      </div>

      <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-4">
        <div>{stockCounter}</div>
        <div className="flex items-center gap-2 sm:gap-4 sm:ml-4 flex-wrap">
          {columns && onToggleColumn && <ColumnSelector columns={columns} onToggleColumn={onToggleColumn} isLoading={columnsLoading} />}
          {extraControls}
          {selectedCount > 0 && onBulkDelete && <>
              <span className="text-sm text-muted-foreground">
                {selectedCount} selected
              </span>
              <Button size="sm" variant="outline" onClick={onBulkDelete}>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Selected
              </Button>
            </>}
        </div>
      </div>
    </div>

    {/* Table Content */}
    <Card>
      <CardContent className="p-0">
        {children}
      </CardContent>
    </Card>
  </div>);
StandardTableWrapper.displayName = "StandardTableWrapper";
interface StandardTableProps {
  children: React.ReactNode;
  className?: string;
}
export const StandardTable = React.forwardRef<HTMLTableElement, StandardTableProps>(({
  children,
  className
}, ref) => <Table ref={ref} className={className}>
    {children}
  </Table>);
StandardTable.displayName = "StandardTable";
interface StandardTableHeaderProps {
  children: React.ReactNode;
}
export const StandardTableHeader = React.forwardRef<HTMLTableSectionElement, StandardTableHeaderProps>(({
  children
}, ref) => <TableHeader ref={ref}>
    {children}
  </TableHeader>);
StandardTableHeader.displayName = "StandardTableHeader";
interface StandardTableBodyProps {
  children: React.ReactNode;
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
  colSpan?: number;
}
export const StandardTableBody = React.forwardRef<HTMLTableSectionElement, StandardTableBodyProps>(({
  children,
  emptyMessage = "No data found",
  emptyIcon,
  colSpan = 8
}, ref) => <TableBody ref={ref}>
    {React.Children.count(children) === 0 ? <tr>
        <td colSpan={colSpan} className="text-center py-12">
          <div className="flex flex-col items-center text-muted-foreground">
            {emptyIcon && <div className="mb-2">{emptyIcon}</div>}
            <span className="text-lg font-medium">{emptyMessage}</span>
          </div>
        </td>
      </tr> : children}
  </TableBody>);
StandardTableBody.displayName = "StandardTableBody";