
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useEmailTemplates } from '@/hooks/email/useEmailTemplates';
import { EmailTemplateDialog } from '../dialogs/EmailTemplateDialog';
import { EmailTemplatesTable } from '../tables/EmailTemplatesTable';

export const EmailTemplatesTab: React.FC = () => {
  const { templates, isLoading } = useEmailTemplates();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);

  const handleEdit = (template: any) => {
    setEditingTemplate(template);
  };

  const handleCloseDialog = () => {
    setShowCreateDialog(false);
    setEditingTemplate(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Email Templates</h2>
        <Button onClick={() => setShowCreateDialog(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Create Template
        </Button>
      </div>

      <EmailTemplatesTable
        templates={templates}
        isLoading={isLoading}
        onEdit={handleEdit}
      />

      <EmailTemplateDialog
        open={showCreateDialog || !!editingTemplate}
        onOpenChange={handleCloseDialog}
        template={editingTemplate}
        mode={editingTemplate ? 'edit' : 'create'}
      />
    </div>
  );
};
