
import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Plus, Search } from 'lucide-react';
import { useEmailTemplates } from '@/hooks/email/useEmailTemplates';
import { useTablePermissions } from '@/hooks/useTablePermissions';
import { EmailTemplateDialog } from '../dialogs/EmailTemplateDialog';
import { EmailTemplatesTable } from '../tables/EmailTemplatesTable';
import { EmailPreviewDialog } from '../dialogs/EmailPreviewDialog';
import { TablePagination } from '@/components/ui/table-pagination';

export const EmailTemplatesTab: React.FC = () => {
  const { canCreate } = useTablePermissions('email');
  const { 
    templates, 
    isLoading, 
    showOnlyMyTemplates, 
    searchQuery, 
    setSearchQuery, 
    toggleMyTemplatesFilter, 
    copyTemplate,
    canEditTemplate,
    canCopyTemplate 
  } = useEmailTemplates();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [previewingTemplate, setPreviewingTemplate] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  
  const ITEMS_PER_PAGE = 25;

  const paginatedTemplates = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return templates.slice(startIndex, endIndex);
  }, [templates, currentPage]);

  const totalPages = Math.ceil(templates.length / ITEMS_PER_PAGE);

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

  const handleCopy = async (templateId: string) => {
    copyTemplate(templateId);
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

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            id="my-templates"
            checked={showOnlyMyTemplates}
            onCheckedChange={toggleMyTemplatesFilter}
          />
          <Label htmlFor="my-templates">My Templates</Label>
        </div>
      </div>

      <EmailTemplatesTable
        templates={paginatedTemplates}
        isLoading={isLoading}
        onEdit={handleEdit}
        onView={handleView}
        onCopy={handleCopy}
        canEditTemplate={canEditTemplate}
        canCopyTemplate={canCopyTemplate}
      />

      {templates.length > ITEMS_PER_PAGE && (
        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={templates.length}
          onPageChange={setCurrentPage}
        />
      )}

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
