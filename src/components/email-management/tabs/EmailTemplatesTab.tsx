
import React, { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Plus, Search } from 'lucide-react';
import { useEmailTemplates } from '@/hooks/email/useEmailTemplates';
import { EmailTemplatesTable } from '../tables/EmailTemplatesTable';
import { TablePagination } from '@/components/ui/table-pagination';
import { useIsMobile } from '@/hooks/use-mobile';
import { EmailTemplatesCards } from '../cards/EmailTemplatesCards';

export const EmailTemplatesTab: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const { 
    templates, 
    isLoading, 
    showOnlyMyTemplates, 
    searchQuery, 
    setSearchQuery, 
    toggleMyTemplatesFilter,
    copyTemplate,
    canEditTemplate,
    canCopyTemplate,
    canDeleteTemplate,
    canViewTemplate,
    canCreate
  } = useEmailTemplates();
  
  const [previewingTemplate, setPreviewingTemplate] = useState<any>(null);
  
  // Debug permissions
  console.log('EmailTemplatesTab canCreate from hook:', canCreate);
  const [currentPage, setCurrentPage] = useState(1);
  
  const ITEMS_PER_PAGE = 25;

  const paginatedTemplates = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return templates.slice(startIndex, endIndex);
  }, [templates, currentPage]);

  const totalPages = Math.ceil(templates.length / ITEMS_PER_PAGE);

  const handleEdit = (template: any) => {
    navigate(`/app/email/template_record/${template.id}?mode=edit`);
  };

  const handleView = (template: any) => {
    navigate('/app/email/email_preview_record', {
      state: {
        subject: template.subject,
        body: template.body,
        sourceTable: template.source_table,
        templateId: template.id,
        from: location.pathname
      }
    });
  };

  const handleCreate = () => {
    navigate('/app/email/template_record?mode=create');
  };

  const handleCopy = async (templateId: string) => {
    copyTemplate(templateId);
  };

  return (
    <div className="space-y-4">
      <div className={`flex ${isMobile ? 'flex-col gap-4' : 'justify-between items-center'}`}>
        <h2 className="text-2xl font-semibold">Email Templates</h2>
        {canCreate && (
          <Button onClick={handleCreate} className={`flex items-center gap-2 ${isMobile ? 'w-full' : ''}`}>
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

      {isMobile ? (
        <EmailTemplatesCards
          templates={paginatedTemplates}
          isLoading={isLoading}
          onEdit={handleEdit}
          onView={handleView}
          onCopy={handleCopy}
          canEditTemplate={canEditTemplate}
          canCopyTemplate={canCopyTemplate}
          canDeleteTemplate={canDeleteTemplate}
          canViewTemplate={canViewTemplate}
        />
      ) : (
        <EmailTemplatesTable
          templates={paginatedTemplates}
          isLoading={isLoading}
          onEdit={handleEdit}
          onView={handleView}
          onCopy={handleCopy}
          canEditTemplate={canEditTemplate}
          canCopyTemplate={canCopyTemplate}
          canDeleteTemplate={canDeleteTemplate}
          canViewTemplate={canViewTemplate}
        />
      )}

      {templates.length > ITEMS_PER_PAGE && (
        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={templates.length}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
};
