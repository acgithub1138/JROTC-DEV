import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCPScoreSheetsPermissions } from '@/hooks/useModuleSpecificPermissions';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Plus, Search } from 'lucide-react';
import { useSortableTable } from '@/hooks/useSortableTable';
import { TemplatesTable } from '../competition-management/components/TemplatesTable';
import { useCompetitionTemplates, type CompetitionTemplate } from './my-competitions/hooks/useCompetitionTemplates';
import { useAuth } from '@/contexts/AuthContext';
import { TablePagination } from '@/components/ui/table-pagination';
import type { Database } from '@/integrations/supabase/types';




export const ScoreSheetsPage = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  
  const {
    templates,
    isLoading,
    showOnlyMyTemplates,
    searchQuery,
    setSearchQuery,
    deleteTemplate,
    copyTemplate,
    toggleMyTemplatesFilter,
    canEditTemplate,
    canCopyTemplate,
    refetch
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

  const { canCreate, canUpdate, canDelete, canViewDetails, canView } = useCPScoreSheetsPermissions();

  const handleAddTemplate = () => {
    navigate('/app/competition-portal/score-sheets/score_sheet_record?mode=create');
  };

  const handleEditTemplate = (template: CompetitionTemplate) => {
    navigate(`/app/competition-portal/score-sheets/score_sheet_record?mode=edit&id=${template.id}`);
  };

  const handleViewTemplate = (template: CompetitionTemplate) => {
    navigate(`/app/competition-portal/score-sheets/score_sheet_record?mode=view&id=${template.id}`);
  };

  const handleCopy = async (templateId: string) => {
    await copyTemplate(templateId);
  };

  if (!canView) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">You don't have permission to view score sheet templates.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Score Sheet Templates</h1>
        <p className="text-muted-foreground">
          Manage competition score sheet templates for events
        </p>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search by template name, event type, or JROTC program..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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
            {canCreate && (
              <Button onClick={handleAddTemplate}>
                <Plus className="w-4 h-4 md:mr-2" />
                <span className="hidden md:inline">Add Template</span>
              </Button>
            )}
          </div>
        </div>

        <TemplatesTable
          templates={paginatedTemplates as any}
          isLoading={isLoading}
          sortConfig={sortConfig}
          onSort={handleSort}
          onEdit={canUpdate ? handleEditTemplate : undefined}
          onDelete={canDelete ? deleteTemplate : undefined}
          onCopy={canCreate ? handleCopy : undefined}
          onPreview={canViewDetails ? handleViewTemplate : undefined}
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

      </div>
    </div>
  );
};