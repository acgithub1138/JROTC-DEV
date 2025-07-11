import React from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Edit, Trash2, Copy, Eye, Globe, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { CompetitionTemplate } from '../types';
import { SortConfig } from '@/components/ui/sortable-table';
interface TemplatesTableProps {
  templates: CompetitionTemplate[];
  isLoading: boolean;
  sortConfig?: SortConfig | null;
  onSort?: (key: string) => void;
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
  sortConfig,
  onSort,
  onEdit,
  onDelete,
  onCopy,
  onPreview,
  canEditTemplate,
  canCopyTemplate
}) => {
  const getSortIcon = (columnKey: string) => {
    if (!sortConfig || sortConfig.key !== columnKey) {
      return <ArrowUpDown className="w-4 h-4" />;
    }
    return sortConfig.direction === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />;
  };
  const SortableHeader = ({
    children,
    sortKey
  }: {
    children: React.ReactNode;
    sortKey: string;
  }) => <TableHead>
      <Button variant="ghost" className="h-auto p-0 font-semibold hover:bg-transparent" onClick={() => onSort?.(sortKey)}>
        <div className="flex items-center gap-2">
          {children}
          {getSortIcon(sortKey)}
        </div>
      </Button>
    </TableHead>;
  if (isLoading) {
    return <div className="space-y-2">
        {[1, 2, 3].map(i => <div key={i} className="h-12 bg-muted rounded animate-pulse" />)}
      </div>;
  }
  if (templates.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">
        <p>No templates found</p>
      </div>;
  }
  return <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <SortableHeader sortKey="template_name">Template Name</SortableHeader>
            <SortableHeader sortKey="event">Event Type</SortableHeader>
            <SortableHeader sortKey="jrotc_program">JROTC Program</SortableHeader>
            <SortableHeader sortKey="created_at">Created</SortableHeader>
            <TableHead className="text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {templates.map(template => <TableRow key={template.id}>
              <TableCell className="font-medium">
                <div className="flex items-center gap-2 py-[4px]">
                  {template.template_name}
                  {template.is_global && <div title="Global Template">
                      <Globe className="w-4 h-4 text-blue-500" />
                    </div>}
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
                {new Date(template.created_at).toLocaleDateString()}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex gap-2 justify-end">
                  {onPreview && <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => onPreview(template)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Preview template</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>}
                  {onCopy && canCopyTemplate?.(template) && <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => onCopy(template.id)}>
                            <Copy className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Copy template</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>}
                  {onEdit && canEditTemplate?.(template) && <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => onEdit(template)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Edit template</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>}
                  {onDelete && canEditTemplate?.(template) && <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => onDelete(template.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Delete template</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>}
                </div>
              </TableCell>
            </TableRow>)}
        </TableBody>
      </Table>
    </div>;
};