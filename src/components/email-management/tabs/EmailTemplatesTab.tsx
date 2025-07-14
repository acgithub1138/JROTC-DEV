
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useEmailTemplates } from '@/hooks/email/useEmailTemplates';
import { useTablePermissions } from '@/hooks/useTablePermissions';
import { EmailTemplateDialog } from '../dialogs/EmailTemplateDialog';
import { EmailTemplatesTable } from '../tables/EmailTemplatesTable';
import { EmailPreviewDialog } from '../dialogs/EmailPreviewDialog';

export const EmailTemplatesTab: React.FC = () => {
  const { canCreate } = useTablePermissions('email');
  const { templates, isLoading } = useEmailTemplates();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [previewingTemplate, setPreviewingTemplate] = useState<any>(null);

  const handleEdit = (template: any) => {
    setEditingTemplate(template);
  };

  const handleView = (template: any) => {
    setPreviewingTemplate(template);
  };

  const handleCloseDialog = () => {
    setShowCreateDialog(false);
    setEditingTemplate(null);
  };

  const handleClosePreviewDialog = () => {
    setPreviewingTemplate(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Email Templates</h2>
        {canCreate && (
          <Button onClick={() => setShowCreateDialog(true)} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Create Template
          </Button>
        )}
      </div>

      <EmailTemplatesTable
        templates={templates}
        isLoading={isLoading}
        onEdit={handleEdit}
        onView={handleView}
      />

      <EmailTemplateDialog
        open={showCreateDialog || !!editingTemplate}
        onOpenChange={handleCloseDialog}
        template={editingTemplate}
        mode={editingTemplate ? 'edit' : 'create'}
      />

      <EmailPreviewDialog
        open={!!previewingTemplate}
        onOpenChange={handleClosePreviewDialog}
        subject={previewingTemplate?.subject || ''}
        body={previewingTemplate?.body || ''}
        sourceTable={previewingTemplate?.source_table || ''}
        templateId={previewingTemplate?.id}
      />
    </div>
  );
};
