import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCompetitionSchools } from '@/hooks/competition-portal/useCompetitionSchools';
import { useTablePermissions } from '@/hooks/useTablePermissions';
import { AddSchoolModal } from '@/components/competition-portal/modals/AddSchoolModal';

interface CompetitionSchoolsTabProps {
  competitionId: string;
}

export const CompetitionSchoolsTab: React.FC<CompetitionSchoolsTabProps> = ({
  competitionId
}) => {
  const { schools, isLoading, createSchoolRegistration } = useCompetitionSchools(competitionId);
  const { canCreate } = useTablePermissions('cp_comp_schools');
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
        <h2 className="text-lg font-semibold">Registered Schools</h2>
        {canCreate && (
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Register School
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
                    Status: {school.status}
                    {school.resource && ` • Resource: ${school.resource}`}
                  </p>
                </div>
                <div className="text-sm text-muted-foreground">
                  Registered: {new Date(school.created_at).toLocaleDateString()}
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
        open={showAddModal}
        onOpenChange={setShowAddModal}
        competitionId={competitionId}
        onSchoolAdded={createSchoolRegistration}
      />
    </div>
  );
};