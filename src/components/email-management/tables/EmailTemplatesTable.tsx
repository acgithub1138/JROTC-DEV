
import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Edit, Trash2, Eye } from 'lucide-react';
import { useEmailTemplates, EmailTemplate } from '@/hooks/email/useEmailTemplates';
import { useEmailPermissions } from '@/hooks/useModuleSpecificPermissions';
import { format } from 'date-fns';

interface EmailTemplatesTableProps {
  templates: EmailTemplate[];
  isLoading: boolean;
  onEdit: (template: EmailTemplate) => void;
  onView?: (template: EmailTemplate) => void;
}

export const EmailTemplatesTable: React.FC<EmailTemplatesTableProps> = ({
  templates,
  isLoading,
  onEdit,
  onView,
}) => {
  const { deleteTemplate } = useEmailTemplates();
  const { canUpdate, canDelete, canViewDetails } = useEmailPermissions();

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      deleteTemplate(id);
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading templates...</div>;
  }

  return (
    <TooltipProvider>
      <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Subject</TableHead>
            <TableHead>Source Table</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {templates.map((template) => (
            <TableRow key={template.id}>
              <TableCell className="font-medium py-2">{template.name}</TableCell>
              <TableCell className="py-2">{template.subject}</TableCell>
              <TableCell className="py-2">
                <Badge variant="outline">{template.source_table}</Badge>
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
                <div className="flex items-center justify-center gap-2">
                  {canViewDetails && onView && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon" className="h-6 w-6"
                          onClick={() => onView(template)}
                        >
                          <Eye className="w-3 h-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>View template</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                  {canUpdate && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon" className="h-6 w-6"
                          onClick={() => onEdit(template)}
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Edit template</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                  {canDelete && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon" className="h-6 w-6 text-red-600 hover:text-red-700 hover:border-red-300"
                          onClick={() => handleDelete(template.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Delete template</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
    </TooltipProvider>
  );
};
