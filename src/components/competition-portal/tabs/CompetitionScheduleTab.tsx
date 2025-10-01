import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCompetitionSchedulePermissions } from '@/hooks/useModuleSpecificPermissions';
import { EventScheduleView } from '../components/schedule/EventScheduleView';
import { JudgeScheduleView } from '../components/schedule/JudgeScheduleView';
import { ResourceScheduleView } from '../components/schedule/ResourceScheduleView';
interface CompetitionScheduleTabProps {
  competitionId: string;
  readOnly?: boolean;
  permissions?: {
    canViewDetails: boolean;
    canCreate: boolean;
    canUpdate: boolean;
    canDelete: boolean;
  };
}
export const CompetitionScheduleTab = ({
  competitionId,
  readOnly = false,
  permissions
}: CompetitionScheduleTabProps) => {
  const [activeTab, setActiveTab] = useState('events');
  const defaultPermissions = useCompetitionSchedulePermissions();
  const {
    canView,
    canManageSchedule,
    canUpdate
  } = permissions ? {
    canView: permissions.canViewDetails,
    canManageSchedule: permissions.canCreate,
    canUpdate: permissions.canUpdate
  } : defaultPermissions;
  if (!canView) {
    return (
      <div className="text-center p-8">
        <p className="text-muted-foreground">You don't have permission to view the schedule.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="judges">Judges</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
        </TabsList>

        <TabsContent value="events">
          <EventScheduleView
            competitionId={competitionId}
            readOnly={readOnly}
            canUpdate={canUpdate}
          />
        </TabsContent>

        <TabsContent value="judges">
          <JudgeScheduleView competitionId={competitionId} />
        </TabsContent>

        <TabsContent value="resources">
          <ResourceScheduleView competitionId={competitionId} />
        </TabsContent>
      </Tabs>
    </div>
  );
};