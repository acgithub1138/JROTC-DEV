import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAvailableTables } from '@/hooks/email/useTableColumns';

interface TableSelectorProps {
  selectedTable: string;
  onTableChange: (table: string) => void;
}

export const TableSelector: React.FC<TableSelectorProps> = ({
  selectedTable,
  onTableChange
}) => {
  const { data: tables = [], isLoading } = useAvailableTables();

  return (
    <Select value={selectedTable} onValueChange={onTableChange} disabled={isLoading}>
      <SelectTrigger>
        <SelectValue placeholder="Select a table..." />
      </SelectTrigger>
      <SelectContent>
        {tables.map((table) => (
          <SelectItem key={table.name} value={table.name}>
            {table.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};