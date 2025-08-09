import React, { useState, useMemo } from 'react';
import { useCompetitionPermissions } from '@/hooks/useModuleSpecificPermissions';
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
import { TablePagination } from '@/components/ui/table-pagination';
import type { Database } from '@/integrations/supabase/types';

type CompetitionTemplate = Database['public']['Tables']['competition_templates']['Row'];

interface TemplatesTabProps {
  readOnly?: boolean;
}

export const TemplatesTab = ({ readOnly = false }: TemplatesTabProps) => {
  const { userProfile } = useAuth();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<CompetitionTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<CompetitionTemplate | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

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

  const {
    sortedData: sortedTemplates,
    sortConfig,
    handleSort
  } = useSortableTable({
    data: templates,
    defaultSort: {
      key: 'template_name',
      direction: 'asc'
    }
  });

  // Pagination constants for templates (25 per page)
  const TEMPLATES_PER_PAGE = 25;
  
  // Calculate pagination
  const totalPages = Math.ceil(sortedTemplates.length / TEMPLATES_PER_PAGE);
  const paginatedTemplates = useMemo(() => {
    const startIndex = (currentPage - 1) * TEMPLATES_PER_PAGE;
    const endIndex = startIndex + TEMPLATES_PER_PAGE;
    return sortedTemplates.slice(startIndex, endIndex);
  }, [sortedTemplates, currentPage]);

  // Reset to first page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, showOnlyMyTemplates]);

  const { canCreate, canUpdate, canDelete, canViewDetails } = useCompetitionPermissions();

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
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input 
            placeholder="Search by template name, event type, or JROTC program..." 
            value={searchQuery} 
            onChange={e => setSearchQuery(e.target.value)} 
            className="pl-10" 
          />
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
          {!readOnly && (
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Template
            </Button>
          )}
        </div>
      </div>

      <TemplatesTable 
        templates={paginatedTemplates as any} 
        isLoading={isLoading} 
        sortConfig={sortConfig} 
        onSort={handleSort} 
        onEdit={!readOnly && canUpdate ? (t: any) => setEditingTemplate(t) : undefined} 
        onDelete={!readOnly && canDelete ? deleteTemplate : undefined} 
        onCopy={canCreate ? handleCopy : undefined} 
        onPreview={canViewDetails ? (t: any) => setPreviewTemplate(t) : undefined} 
        canEditTemplate={(t: any) => canEditTemplate(t)} 
        canCopyTemplate={(t: any) => canCreate && canCopyTemplate(t)} 
      />

      {/* Pagination */}
      <TablePagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={sortedTemplates.length}
        onPageChange={setCurrentPage}
      />

      {!readOnly && (canCreate || canUpdate) && (
        <TemplateDialog 
          open={showAddDialog || !!editingTemplate} 
          onOpenChange={open => {
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
        onOpenChange={open => !open && setPreviewTemplate(null)} 
        template={previewTemplate as any} 
      />
    </div>
  );
};