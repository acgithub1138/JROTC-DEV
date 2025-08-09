import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Edit, Copy, Trash2 } from 'lucide-react';
import { formatTimeForDisplay } from '@/utils/timeDisplayUtils';
import type { CompetitionTemplate } from '../types';

interface TemplatesTableProps {
  templates: CompetitionTemplate[];
  sortConfig: { key: string; direction: 'asc' | 'desc' } | null;
  onSort: (key: string) => void;
  onEdit: (template: CompetitionTemplate) => void;
  onCopy: (template: CompetitionTemplate) => void;
  onDelete: (template: CompetitionTemplate) => void;
  onPreview: (template: CompetitionTemplate) => void;
  permissions: {
    canUpdate: boolean;
    canDelete: boolean;
    canViewDetails: boolean;
  };
  readOnly?: boolean;
}

export const TemplatesTable: React.FC<TemplatesTableProps> = ({
  templates,
  sortConfig,
  onSort,
  onEdit,
  onCopy,
  onDelete,
  onPreview,
  permissions,
  readOnly = false
}) => {
  const getSortIcon = (key: string) => {
    if (sortConfig?.key !== key) return null;
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead 
              className="cursor-pointer"
              onClick={() => onSort('template_name')}
            >
              Template Name {getSortIcon('template_name')}
            </TableHead>
            <TableHead 
              className="cursor-pointer"
              onClick={() => onSort('event')}
            >
              Event {getSortIcon('event')}
            </TableHead>
            <TableHead 
              className="cursor-pointer"
              onClick={() => onSort('jrotc_program')}
            >
              Program {getSortIcon('jrotc_program')}
            </TableHead>
            <TableHead>Status</TableHead>
            <TableHead 
              className="cursor-pointer"
              onClick={() => onSort('created_at')}
            >
              Created {getSortIcon('created_at')}
            </TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {templates.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                No templates found
              </TableCell>
            </TableRow>
          ) : (
            templates.map((template) => (
              <TableRow key={template.id}>
                <TableCell className="font-medium">
                  {template.template_name}
                </TableCell>
                <TableCell>{template.event}</TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {template.jrotc_program?.toUpperCase() || 'N/A'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={template.is_active ? 'default' : 'secondary'}>
                    {template.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                  {template.is_global && (
                    <Badge variant="outline" className="ml-2">
                      Global
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  {formatTimeForDisplay(template.created_at, 'DATE_ONLY', 'UTC')}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    {permissions.canViewDetails && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onPreview(template)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    )}
                    
                    {!readOnly && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onCopy(template)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    )}
                    
                    {!readOnly && permissions.canUpdate && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(template)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    )}
                    
                    {!readOnly && permissions.canDelete && !template.is_global && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(template)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};