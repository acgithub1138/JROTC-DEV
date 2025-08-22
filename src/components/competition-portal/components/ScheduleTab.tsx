import React, { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Calendar, Trophy } from 'lucide-react';
import { CompetitionScheduleTab } from '../tabs/CompetitionScheduleTab';
import { useOpenCompsSchedulePermissions } from '@/hooks/useModuleSpecificPermissions';

interface ScheduleTabProps {
  registeredCompetitions: any[];
}

export const ScheduleTab: React.FC<ScheduleTabProps> = ({ registeredCompetitions }) => {
  const [selectedCompetitionId, setSelectedCompetitionId] = useState<string>('');
  const { canRead, canViewDetails, canCreate, canUpdate, canDelete } = useOpenCompsSchedulePermissions();

  // Check if user can read records
  if (!canRead) {
    return (
      <div className="text-center py-12">
        <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Access Restricted</h3>
        <p className="text-gray-600">
          You don't have permission to view schedules.
        </p>
      </div>
    );
  }

  if (!registeredCompetitions || registeredCompetitions.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Registered Competitions</h3>
        <p className="text-gray-600">
          You need to register for competitions first to view their schedules.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="flex items-center space-x-2">
          <Label htmlFor="competition-filter" className="text-sm">
            Select competition:
          </Label>
          <Select
            value={selectedCompetitionId}
            onValueChange={setSelectedCompetitionId}
          >
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Choose a competition" />
            </SelectTrigger>
            <SelectContent>
              {registeredCompetitions.map((competition) => (
                <SelectItem key={competition.id} value={competition.id}>
                  {competition.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedCompetitionId ? (
        <CompetitionScheduleTab 
          competitionId={selectedCompetitionId} 
          readOnly={true}
          permissions={{
            canViewDetails,
            canCreate,
            canUpdate,
            canDelete
          }}
        />
      ) : (
        <div className="text-center py-12">
          <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Competition</h3>
          <p className="text-gray-600">
            Choose a competition from the dropdown above to view its schedule.
          </p>
        </div>
      )}
    </div>
  );
};