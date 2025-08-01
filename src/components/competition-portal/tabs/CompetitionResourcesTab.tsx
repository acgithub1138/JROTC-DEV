import React, { useState } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCompetitionResources } from '@/hooks/competition-portal/useCompetitionResources';
import { useTablePermissions } from '@/hooks/useTablePermissions';
import { AddResourceModal } from '../modals/AddResourceModal';

interface CompetitionResourcesTabProps {
  competitionId: string;
}

export const CompetitionResourcesTab: React.FC<CompetitionResourcesTabProps> = ({
  competitionId
}) => {
  const { resources, isLoading, deleteResource } = useCompetitionResources(competitionId);
  const { canCreate, canEdit: canUpdate, canDelete } = useTablePermissions('cp_comp_resources');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-16 bg-muted rounded animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Competition Resources</h2>
        {canCreate && (
          <Button onClick={() => setIsAddModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Resource
          </Button>
        )}
      </div>

      {resources.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>No resources assigned for this competition</p>
        </div>
      ) : (
        <div className="space-y-2">
          {resources.map(resource => (
            <div 
              key={resource.id}
              className="p-4 border rounded-lg bg-card"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Resource {resource.resource}</h3>
                  <p className="text-sm text-muted-foreground">
                    {resource.location && `Location: ${resource.location}`}
                    {resource.start_time && ` • ${new Date(resource.start_time).toLocaleString()}`}
                  </p>
                </div>
                {(canUpdate || canDelete) && (
                  <div className="flex gap-1">
                    {canUpdate && (
                      <Button variant="ghost" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                    )}
                    {canDelete && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this resource assignment?')) {
                            deleteResource(resource.id);
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
              {resource.assignment_details && (
                <p className="mt-2 text-sm text-muted-foreground">{resource.assignment_details}</p>
              )}
            </div>
          ))}
        </div>
      )}

      <AddResourceModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        competitionId={competitionId}
      />
    </div>
  );
};