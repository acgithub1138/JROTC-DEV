import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';
import { useTeams } from './hooks/useTeams';
import { useTeamMutations } from './hooks/useTeamMutations';
import { TeamsPageHeader } from './components/TeamsPageHeader';
import { TeamsTable } from './components/TeamsTable';
import { TeamCards } from './components/TeamCards';
import { useIsMobile } from '@/hooks/use-mobile';
import { SendEmailDialog } from './components/SendEmailDialog';
import { ViewTeamMembersDialog } from './components/ViewTeamMembersDialog';
import { TeamWithMembers } from './types';
import { useTablePermissions } from '@/hooks/useTablePermissions';
import { useNavigate } from 'react-router-dom';
const TeamsManagementPage = () => {
  const {
    teams,
    loading,
    refetch
  } = useTeams();
  const {
    deleteTeam
  } = useTeamMutations();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const {
    canCreate,
    canEdit: canUpdate,
    canDelete
  } = useTablePermissions('teams');
  const [sendEmailDialogOpen, setSendEmailDialogOpen] = useState(false);
  const [viewMembersDialogOpen, setViewMembersDialogOpen] = useState(false);
  const [emailTeam, setEmailTeam] = useState<TeamWithMembers | null>(null);
  const [viewingTeam, setViewingTeam] = useState<TeamWithMembers | null>(null);
  const handleAddTeam = () => {
    navigate('/app/teams/team_record');
  };
  const handleEditTeam = (team: TeamWithMembers) => {
    navigate(`/app/teams/team_record?id=${team.id}`);
  };
  const handleDeleteTeam = async (teamId: string) => {
    const success = await deleteTeam(teamId);
    if (success) {
      refetch();
    }
    return success;
  };
  const handleSendEmail = (team: TeamWithMembers) => {
    setEmailTeam(team);
    setSendEmailDialogOpen(true);
  };
  const handleViewMembers = (team: TeamWithMembers) => {
    setViewingTeam(team);
    setViewMembersDialogOpen(true);
  };
  if (loading) {
    return <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-gray-200 rounded"></div>)}
          </div>
        </div>
      </div>;
  }
  return <div className="p-6 space-y-6">
      <TeamsPageHeader onAddTeam={handleAddTeam} canCreate={canCreate} />

      <Card>
        
        <CardContent className="py-[8px]">
          {isMobile ? <TeamCards teams={teams} isLoading={loading} onEdit={handleEditTeam} onDelete={handleDeleteTeam} onViewMembers={handleViewMembers} onSendEmail={handleSendEmail} canUpdate={canUpdate} canDelete={canDelete} /> : <TeamsTable teams={teams} onEditTeam={handleEditTeam} onDeleteTeam={handleDeleteTeam} onSendEmail={handleSendEmail} onViewMembers={handleViewMembers} canUpdate={canUpdate} canDelete={canDelete} />}

          {teams.length === 0 && <div className="text-center py-8 text-muted-foreground">
              No teams found. Create your first team to get started.
            </div>}
        </CardContent>
      </Card>


      <SendEmailDialog open={sendEmailDialogOpen} onOpenChange={setSendEmailDialogOpen} team={emailTeam} />

      <ViewTeamMembersDialog open={viewMembersDialogOpen} onOpenChange={setViewMembersDialogOpen} team={viewingTeam} />
    </div>;
};
export default TeamsManagementPage;