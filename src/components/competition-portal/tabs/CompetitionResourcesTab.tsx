import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCompetitionResources } from '@/hooks/competition-portal/useCompetitionResources';
import { useTablePermissions } from '@/hooks/useTablePermissions';
import { AddResourceModal } from '@/components/competition-portal/modals/AddResourceModal';

interface CompetitionResourcesTabProps {
  competitionId: string;
}

export const CompetitionResourcesTab: React.FC<CompetitionResourcesTabProps> = ({
  competitionId
}) => {
  const { resources, isLoading, createResource } = useCompetitionResources(competitionId);
  const { canCreate } = useTablePermissions('cp_comp_resources');
  const [showAddModal, setShowAddModal] = useState(false);

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
          <Button onClick={() => setShowAddModal(true)}>
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
              </div>
              {resource.assignment_details && (
                <p className="mt-2 text-sm text-muted-foreground">{resource.assignment_details}</p>
              )}
            </div>
          ))}
        </div>
      )}

      <AddResourceModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        competitionId={competitionId}
        onResourceAdded={createResource}
      />
    </div>
  );
};