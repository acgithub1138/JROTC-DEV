
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Edit, Trash2 } from 'lucide-react';

interface Option {
  id: string;
  value: string;
  label: string;
  color_class: string;
  sort_order: number;
  is_active: boolean;
}

interface OptionsTableProps {
  options: Option[];
  onEdit: (option: Option) => void;
  onDelete: (id: string) => void;
}

export const OptionsTable: React.FC<OptionsTableProps> = ({
  options,
  onEdit,
  onDelete
}) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Label</TableHead>
          <TableHead>Value</TableHead>
          <TableHead>Color</TableHead>
          <TableHead>Sort Order</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {options.map((option) => (
          <TableRow key={option.id}>
            <TableCell>{option.label}</TableCell>
            <TableCell><code>{option.value}</code></TableCell>
            <TableCell>
              <Badge className={option.color_class}>{option.label}</Badge>
            </TableCell>
            <TableCell>{option.sort_order}</TableCell>
            <TableCell>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" onClick={() => onEdit(option)}>
                  <Edit className="w-3 h-3" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => onDelete(option.id)}>
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
