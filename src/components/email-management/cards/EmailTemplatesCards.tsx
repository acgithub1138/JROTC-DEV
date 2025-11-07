import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Eye, Copy, Globe } from 'lucide-react';
import { useEmailTemplates, EmailTemplate } from '@/hooks/email/useEmailTemplates';
import { format } from 'date-fns';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface EmailTemplatesCardsProps {
  templates: EmailTemplate[];
  isLoading: boolean;
  onEdit: (template: EmailTemplate) => void;
  onView?: (template: EmailTemplate) => void;
  onCopy?: (templateId: string) => void;
  canEditTemplate?: (template: EmailTemplate) => boolean;
  canCopyTemplate?: (template: EmailTemplate) => boolean;
  canDeleteTemplate?: (template: EmailTemplate) => boolean;
  canViewTemplate?: (template: EmailTemplate) => boolean;
}

export const EmailTemplatesCards: React.FC<EmailTemplatesCardsProps> = ({
  templates,
  isLoading,
  onEdit,
  onView,
  onCopy,
  canEditTemplate,
  canCopyTemplate,
  canDeleteTemplate,
  canViewTemplate
}) => {
  const { deleteTemplate } = useEmailTemplates();
  const [templateToDelete, setTemplateToDelete] = useState<EmailTemplate | null>(null);

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

  if (templates.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">No templates found</div>;
  }

  return (
    <>
      <div className="space-y-4">
        {templates.map((template) => (
          <Card key={template.id} className="w-full">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">
                  {canViewTemplate?.(template) && onView ? (
                    <button 
                      onClick={() => onView(template)} 
                      className="text-blue-600 hover:text-blue-800 hover:underline transition-colors text-left"
                    >
                      {template.name}
                    </button>
                  ) : (
                    <span>{template.name}</span>
                  )}
                </CardTitle>
                <div className="flex flex-col gap-1">
                  {template.is_global ? (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Globe className="w-3 h-3" />
                      Global
                    </Badge>
                  ) : (
                    <Badge variant="outline">School</Badge>
                  )}
                  <Badge variant={template.is_active ? 'default' : 'secondary'}>
                    {template.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Subject:</span>
                  <p className="font-medium">{template.subject}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Source Table:</span>
                  <div className="mt-1">
                    <Badge variant="outline">{template.source_table}</Badge>
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Created:</span>
                  <p className="font-medium">{format(new Date(template.created_at), 'MMM dd, yyyy')}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 pt-2">
                {canViewTemplate?.(template) && onView && (
                  <Button 
                    variant="outline" 
                    size="default" 
                    className="w-full" 
                    onClick={() => onView(template)}
                    title="View"
                  >
                    <Eye className="w-4 h-4" />
                    <span className="ml-2">View</span>
                  </Button>
                )}
                {onCopy && canCopyTemplate?.(template) && (
                  <Button 
                    variant="outline" 
                    size="default" 
                    className="w-full" 
                    onClick={() => onCopy(template.id)}
                    title="Copy"
                  >
                    <Copy className="w-4 h-4" />
                    <span className="ml-2">Copy</span>
                  </Button>
                )}
                {canEditTemplate?.(template) && (
                  <Button 
                    variant="outline" 
                    size="default" 
                    className="w-full" 
                    onClick={() => onEdit(template)}
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                    <span className="ml-2">Edit</span>
                  </Button>
                )}
                {canDeleteTemplate?.(template) && (
                  <Button 
                    variant="outline" 
                    size="default" 
                    className="w-full text-red-600 hover:text-red-700 hover:border-red-300" 
                    onClick={() => handleDeleteClick(template)}
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="ml-2">Delete</span>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
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
            <AlertDialogAction 
              onClick={handleConfirmDelete} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Template
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
