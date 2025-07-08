import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Plus, Search } from 'lucide-react';
import { useSortableTable } from '@/hooks/useSortableTable';
import { TemplatesTable } from '../components/TemplatesTable';
import { TemplateDialog } from '../components/TemplateDialog';
import { TemplatePreviewDialog } from '../components/TemplatePreviewDialog';
import { useCompetitionTemplates } from '../hooks/useCompetitionTemplates';
import { useAuth } from '@/contexts/AuthContext';
import type { Database } from '@/integrations/supabase/types';

type CompetitionTemplate = Database['public']['Tables']['competition_templates']['Row'];

export const TemplatesTab = () => {
  const { userProfile } = useAuth();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<CompetitionTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<CompetitionTemplate | null>(null);
  
  const {
    templates,
    isLoading,
    showOnlyMyTemplates,
    searchQuery,
    setSearchQuery,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    copyTemplate,
    toggleMyTemplatesFilter,
    canEditTemplate,
    canCopyTemplate
  } = useCompetitionTemplates();

  const { sortedData: sortedTemplates, sortConfig, handleSort } = useSortableTable({
    data: templates,
    defaultSort: { key: 'template_name', direction: 'asc' }
  });

  const canManageTemplates = userProfile?.role === 'admin' || userProfile?.role === 'instructor' || userProfile?.role === 'command_staff';

  const handleSubmit = async (data: any) => {
    if (editingTemplate) {
      await updateTemplate(editingTemplate.id, data);
      setEditingTemplate(null);
    } else {
      await createTemplate(data);
      setShowAddDialog(false);
    }
  };

  const handleCopy = async (templateId: string) => {
    await copyTemplate(templateId);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Score Sheet Templates</h2>
          <p className="text-muted-foreground">
            Global templates for competition score sheets
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="my-templates"
              checked={showOnlyMyTemplates}
              onCheckedChange={toggleMyTemplatesFilter}
            />
            <Label htmlFor="my-templates">My Templates</Label>
          </div>
          {canManageTemplates && (
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Template
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search by template name, event type, or JROTC program..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <TemplatesTable
        templates={sortedTemplates as any}
        isLoading={isLoading}
        sortConfig={sortConfig}
        onSort={handleSort}
        onEdit={canManageTemplates ? ((t: any) => setEditingTemplate(t)) : undefined}
        onDelete={canManageTemplates ? deleteTemplate : undefined}
        onCopy={handleCopy}
        onPreview={(t: any) => setPreviewTemplate(t)}
        canEditTemplate={(t: any) => canEditTemplate(t)}
        canCopyTemplate={(t: any) => canCopyTemplate(t)}
      />

      {canManageTemplates && (
        <TemplateDialog
          open={showAddDialog || !!editingTemplate}
          onOpenChange={(open) => {
            if (!open) {
              setShowAddDialog(false);
              setEditingTemplate(null);
            }
          }}
          template={editingTemplate as any}
          onSubmit={handleSubmit}
        />
      )}

      <TemplatePreviewDialog
        open={!!previewTemplate}
        onOpenChange={(open) => !open && setPreviewTemplate(null)}
        template={previewTemplate as any}
      />
    </div>
  );
};