import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { useTableColumns } from '@/hooks/email/useTableColumns';

interface FieldSelectorProps {
  selectedTable: string;
  selectedFields: string[];
  onFieldsChange: (fields: string[]) => void;
}

export const FieldSelector: React.FC<FieldSelectorProps> = ({
  selectedTable,
  selectedFields,
  onFieldsChange
}) => {
  const { data: columns = [], isLoading } = useTableColumns(selectedTable);

  const handleFieldToggle = (fieldName: string, checked: boolean) => {
    if (checked) {
      onFieldsChange([...selectedFields, fieldName]);
    } else {
      onFieldsChange(selectedFields.filter(field => field !== fieldName));
    }
  };

  if (!selectedTable) {
    return (
      <div className="text-sm text-muted-foreground text-center py-8">
        Select a table first to see available fields
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="text-sm text-muted-foreground text-center py-8">
        Loading fields...
      </div>
    );
  }

  if (columns.length === 0) {
    return (
      <div className="text-sm text-muted-foreground text-center py-8">
        No fields available for this table
      </div>
    );
  }

  return (
    <ScrollArea className="h-64">
      <div className="space-y-2">
        {columns.map((column) => (
          <div key={column.column_name} className="flex items-center space-x-2">
            <Checkbox
              id={column.column_name}
              checked={selectedFields.includes(column.column_name)}
              onCheckedChange={(checked) => 
                handleFieldToggle(column.column_name, checked as boolean)
              }
            />
            <Label 
              htmlFor={column.column_name} 
              className="text-sm font-normal cursor-pointer flex-1"
            >
              <div>
                <div className="font-medium">{column.display_label}</div>
                <div className="text-xs text-muted-foreground">
                  {column.column_name} • {column.data_type}
                </div>
              </div>
            </Label>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
};