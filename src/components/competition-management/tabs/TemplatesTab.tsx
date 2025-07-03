import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { TemplatesTable } from '../components/TemplatesTable';
import { TemplateDialog } from '../components/TemplateDialog';
import { useCompetitionTemplates } from '../hooks/useCompetitionTemplates';
import { useAuth } from '@/contexts/AuthContext';
import type { Database } from '@/integrations/supabase/types';

type CompetitionTemplate = Database['public']['Tables']['competition_templates']['Row'];

export const TemplatesTab = () => {
  const { userProfile } = useAuth();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<CompetitionTemplate | null>(null);
  
  const {
    templates,
    isLoading,
    createTemplate,
    updateTemplate,
    deleteTemplate
  } = useCompetitionTemplates();

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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Score Sheet Templates</h2>
          <p className="text-muted-foreground">
            Global templates for competition score sheets
          </p>
        </div>
        {canManageTemplates && (
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Template
          </Button>
        )}
      </div>

      <TemplatesTable
        templates={templates as any}
        isLoading={isLoading}
        onEdit={canManageTemplates ? ((t: any) => setEditingTemplate(t)) : undefined}
        onDelete={canManageTemplates ? deleteTemplate : undefined}
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
    </div>
  );
};