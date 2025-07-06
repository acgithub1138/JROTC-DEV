import React from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Copy, Eye, Globe } from 'lucide-react';
import { CompetitionTemplate } from '../types';

interface TemplatesTableProps {
  templates: CompetitionTemplate[];
  isLoading: boolean;
  onEdit?: (template: CompetitionTemplate) => void;
  onDelete?: (id: string) => void;
  onCopy?: (id: string) => void;
  onPreview?: (template: CompetitionTemplate) => void;
  canEditTemplate?: (template: CompetitionTemplate) => boolean;
  canCopyTemplate?: (template: CompetitionTemplate) => boolean;
}

export const TemplatesTable: React.FC<TemplatesTableProps> = ({
  templates,
  isLoading,
  onEdit,
  onDelete,
  onCopy,
  onPreview,
  canEditTemplate,
  canCopyTemplate
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
            <TableHead>Source</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {templates.map((template) => (
            <TableRow key={template.id}>
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  {template.template_name}
                  {template.is_global && (
                    <div title="Global Template">
                      <Globe className="w-4 h-4 text-blue-500" />
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline">{template.event}</Badge>
              </TableCell>
              <TableCell>
                <Badge variant="secondary">
                  {template.jrotc_program.replace('_', ' ').toUpperCase()}
                </Badge>
              </TableCell>
              <TableCell>
                {template.is_global ? (
                  <Badge variant="default" className="bg-blue-100 text-blue-800">
                    Global
                  </Badge>
                ) : (
                  <Badge variant="outline">School</Badge>
                )}
              </TableCell>
              <TableCell>
                {new Date(template.created_at).toLocaleDateString()}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex gap-2 justify-end">
                  {onPreview && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onPreview(template)}
                      title="Preview Template"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  )}
                  {onCopy && canCopyTemplate?.(template) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onCopy(template.id)}
                      title="Copy Template"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  )}
                  {onEdit && canEditTemplate?.(template) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(template)}
                      title="Edit Template"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  )}
                  {onDelete && canEditTemplate?.(template) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDelete(template.id)}
                      title="Delete Template"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};