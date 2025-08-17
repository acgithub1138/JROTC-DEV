import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SortableTableHead } from '@/components/ui/sortable-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Edit, Trash2, Eye, Copy, Globe } from 'lucide-react';
import { useEmailTemplates, EmailTemplate } from '@/hooks/email/useEmailTemplates';
import { useEmailPermissions } from '@/hooks/useModuleSpecificPermissions';
import { format } from 'date-fns';
import { useState, useMemo } from 'react';
import { SortConfig } from '@/components/ui/sortable-table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
interface EmailTemplatesTableProps {
  templates: EmailTemplate[];
  isLoading: boolean;
  onEdit: (template: EmailTemplate) => void;
  onView?: (template: EmailTemplate) => void;
  onCopy?: (templateId: string) => void;
  canEditTemplate?: (template: EmailTemplate) => boolean;
  canCopyTemplate?: (template: EmailTemplate) => boolean;
}
export const EmailTemplatesTable: React.FC<EmailTemplatesTableProps> = ({
  templates,
  isLoading,
  onEdit,
  onView,
  onCopy,
  canEditTemplate,
  canCopyTemplate
}) => {
  const {
    deleteTemplate
  } = useEmailTemplates();
  const {
    canUpdate,
    canDelete,
    canViewDetails
  } = useEmailPermissions();
  const [sortConfig, setSortConfig] = useState<SortConfig | null>({
    key: 'name',
    direction: 'asc'
  });
  const [templateToDelete, setTemplateToDelete] = useState<EmailTemplate | null>(null);
  const sortedTemplates = useMemo(() => {
    if (!sortConfig) return templates;
    return [...templates].sort((a, b) => {
      const aValue = a[sortConfig.key as keyof EmailTemplate];
      const bValue = b[sortConfig.key as keyof EmailTemplate];
      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [templates, sortConfig]);
  const handleSort = (key: string) => {
    setSortConfig(prevConfig => {
      if (prevConfig?.key === key) {
        return {
          key,
          direction: prevConfig.direction === 'asc' ? 'desc' : 'asc'
        };
      }
      return {
        key,
        direction: 'asc'
      };
    });
  };
  const handleDeleteClick = (template: EmailTemplate) => {
    setTemplateToDelete(template);
  };
  const handleConfirmDelete = () => {
    if (templateToDelete) {
      deleteTemplate(templateToDelete.id);
      setTemplateToDelete(null);
    }
  };
  if (isLoading) {
    return <div className="text-center py-8">Loading templates...</div>;
  }
  return <TooltipProvider>
      <div className="border rounded-lg bg-background">
      <Table>
        <TableHeader>
          <TableRow>
            <SortableTableHead sortKey="name" currentSort={sortConfig} onSort={handleSort}>
              Name
            </SortableTableHead>
            <TableHead>Subject</TableHead>
            <TableHead>Source Table</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedTemplates.map(template => <TableRow key={template.id}>
              <TableCell className="font-medium py-2">
                {canViewDetails && onView ? <button onClick={() => onView(template)} className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer bg-transparent border-none p-0 font-medium text-left">
                    {template.name}
                  </button> : template.name}
              </TableCell>
              <TableCell className="py-2">{template.subject}</TableCell>
              <TableCell className="py-2">
                <Badge variant="outline">{template.source_table}</Badge>
              </TableCell>
              <TableCell className="py-2">
                <div className="flex items-center gap-2">
                  {template.is_global ? <Badge variant="secondary" className="flex items-center gap-1">
                      <Globe className="w-3 h-3" />
                      Global
                    </Badge> : <Badge variant="outline">School</Badge>}
                </div>
              </TableCell>
              <TableCell className="py-2">
                <Badge variant={template.is_active ? 'default' : 'secondary'}>
                  {template.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </TableCell>
              <TableCell className="py-2">
                {format(new Date(template.created_at), 'MMM dd, yyyy')}
              </TableCell>
              <TableCell className="py-2">
                <div className="flex items-center justify-start gap-2">
                  {canViewDetails && onView && <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => onView(template)}>
                          <Eye className="w-3 h-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>View template</p>
                      </TooltipContent>
                    </Tooltip>}
                  {onCopy && canCopyTemplate?.(template) && <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => onCopy(template.id)}>
                          <Copy className="w-3 h-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Copy template</p>
                      </TooltipContent>
                    </Tooltip>}
                  {canEditTemplate?.(template) && <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => onEdit(template)}>
                          <Edit className="w-3 h-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Edit template</p>
                      </TooltipContent>
                    </Tooltip>}
                  {canDelete && canEditTemplate?.(template) && <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="icon" className="h-6 w-6 text-red-600 hover:text-red-700 hover:border-red-300" onClick={() => handleDeleteClick(template)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Delete template</p>
                      </TooltipContent>
                    </Tooltip>}
                </div>
              </TableCell>
            </TableRow>)}
        </TableBody>
      </Table>
    </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!templateToDelete} onOpenChange={() => setTemplateToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Email Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the email template "{templateToDelete?.name}"? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete Template
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TooltipProvider>;
};