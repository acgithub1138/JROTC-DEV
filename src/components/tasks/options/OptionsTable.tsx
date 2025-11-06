import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Card } from '@/components/ui/card';
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
  onEdit?: (option: Option) => void;
  onDelete?: (id: string) => void;
}
export const OptionsTable: React.FC<OptionsTableProps> = ({
  options,
  onEdit,
  onDelete
}) => {
  return (
    <Card className="bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Label</TableHead>
            <TableHead>Value</TableHead>
            <TableHead>Color</TableHead>
            <TableHead>Sort Order</TableHead>
            <TableHead className="text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {options.map(option => <TableRow key={option.id}>
              <TableCell className="py-[8px]">{option.label}</TableCell>
              <TableCell>{option.value}</TableCell>
              <TableCell>
                <Badge className={option.color_class}>{option.label}</Badge>
              </TableCell>
              <TableCell>{option.sort_order}</TableCell>
              <TableCell>
                <div className="flex items-center justify-center gap-2">
                  {onEdit && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => onEdit(option)}>
                            <Edit className="w-3 h-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Edit option</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                  {onDelete && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" size="icon" className="h-6 w-6 text-red-600 hover:text-red-700 hover:border-red-300" onClick={() => onDelete(option.id)}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Delete option</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              </TableCell>
            </TableRow>)}
        </TableBody>
      </Table>
    </Card>
  );
};