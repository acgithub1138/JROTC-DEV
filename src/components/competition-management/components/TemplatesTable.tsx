import React from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2 } from 'lucide-react';
import { CompetitionTemplate } from '../types';

interface TemplatesTableProps {
  templates: CompetitionTemplate[];
  isLoading: boolean;
  onEdit?: (template: CompetitionTemplate) => void;
  onDelete?: (id: string) => void;
}

export const TemplatesTable: React.FC<TemplatesTableProps> = ({
  templates,
  isLoading,
  onEdit,
  onDelete
}) => {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 bg-muted rounded animate-pulse" />
        ))}
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No templates found</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Template Name</TableHead>
            <TableHead>Event Type</TableHead>
            <TableHead>JROTC Program</TableHead>
            <TableHead>Created</TableHead>
            {(onEdit || onDelete) && (
              <TableHead className="text-right">Actions</TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {templates.map((template) => (
            <TableRow key={template.id}>
              <TableCell className="font-medium">{template.template_name}</TableCell>
              <TableCell>
                <Badge variant="outline">{template.event}</Badge>
              </TableCell>
              <TableCell>
                <Badge variant="secondary">
                  {template.jrotc_program.replace('_', ' ').toUpperCase()}
                </Badge>
              </TableCell>
              <TableCell>
                {new Date(template.created_at).toLocaleDateString()}
              </TableCell>
              {(onEdit || onDelete) && (
                <TableCell className="text-right">
                  <div className="flex gap-2 justify-end">
                    {onEdit && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(template)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    )}
                    {onDelete && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDelete(template.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};