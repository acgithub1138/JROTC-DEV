import React, { useState } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCompetitionSchools } from '@/hooks/competition-portal/useCompetitionSchools';
import { useTablePermissions } from '@/hooks/useTablePermissions';
import { AddSchoolModal } from '../modals/AddSchoolModal';

interface CompetitionSchoolsTabProps {
  competitionId: string;
}

const getStatusVariant = (status: string) => {
  switch (status) {
    case 'registered':
      return 'default';
    case 'canceled':
      return 'destructive';
    case 'no_show':
      return 'secondary';
    default:
      return 'outline';
  }
};

export const CompetitionSchoolsTab: React.FC<CompetitionSchoolsTabProps> = ({
  competitionId
}) => {
  const { schools, isLoading, deleteSchool } = useCompetitionSchools(competitionId);
  const { canCreate, canEdit: canUpdate, canDelete } = useTablePermissions('cp_comp_schools');
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
        <h2 className="text-lg font-semibold">Registered Schools</h2>
        {canCreate && (
          <Button onClick={() => setIsAddModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add School
          </Button>
        )}
      </div>

      {schools.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>No schools registered for this competition</p>
        </div>
      ) : (
        <div className="space-y-2">
          {schools.map(school => (
            <div 
              key={school.id}
              className="p-4 border rounded-lg bg-card"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">School {school.school_id}</h3>
                  <p className="text-sm text-muted-foreground">
                    Resource: {school.resource || 'Not assigned'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={getStatusVariant(school.status)}>
                    {school.status.replace('_', ' ').toUpperCase()}
                  </Badge>
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
                            if (confirm('Are you sure you want to remove this school from the competition?')) {
                              deleteSchool(school.id);
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
              {school.notes && (
                <p className="mt-2 text-sm text-muted-foreground">{school.notes}</p>
              )}
            </div>
          ))}
        </div>
      )}

      <AddSchoolModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        competitionId={competitionId}
      />
    </div>
  );
};