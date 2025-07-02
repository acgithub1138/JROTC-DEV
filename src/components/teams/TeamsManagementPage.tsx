import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';

import { useTeams } from './hooks/useTeams';
import { useTeamMutations } from './hooks/useTeamMutations';
import { TeamsPageHeader } from './components/TeamsPageHeader';
import { TeamsTable } from './components/TeamsTable';
import { AddTeamDialog } from './components/AddTeamDialog';
import { EditTeamDialog } from './components/EditTeamDialog';
import { TeamWithMembers, NewTeam } from './types';

const TeamsManagementPage = () => {
  const { teams, loading, refetch } = useTeams();
  const { createTeam, updateTeam, deleteTeam } = useTeamMutations();

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<TeamWithMembers | null>(null);

  const [newTeam, setNewTeam] = useState<NewTeam>({
    name: '',
    description: '',
    team_lead_id: '',
    member_ids: []
  });

  const handleAddTeam = async (teamData: NewTeam) => {
    const success = await createTeam(teamData);
    if (success) {
      setAddDialogOpen(false);
      setNewTeam({
        name: '',
        description: '',
        team_lead_id: '',
        member_ids: []
      });
      refetch();
    }
    return success;
  };

  const handleEditTeam = (team: TeamWithMembers) => {
    setEditingTeam(team);
    setEditDialogOpen(true);
  };

  const handleUpdateTeam = async (teamData: Partial<TeamWithMembers>) => {
    if (!editingTeam) return false;
    
    const success = await updateTeam(editingTeam.id, teamData);
    if (success) {
      setEditDialogOpen(false);
      setEditingTeam(null);
      refetch();
    }
    return success;
  };

  const handleDeleteTeam = async (teamId: string) => {
    const success = await deleteTeam(teamId);
    if (success) {
      refetch();
    }
    return success;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <TeamsPageHeader onAddTeam={() => setAddDialogOpen(true)} />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Teams
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TeamsTable 
            teams={teams}
            onEditTeam={handleEditTeam}
            onDeleteTeam={handleDeleteTeam}
          />

          {teams.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No teams found. Create your first team to get started.
            </div>
          )}
        </CardContent>
      </Card>

      <AddTeamDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        newTeam={newTeam}
        setNewTeam={setNewTeam}
        onAddTeam={handleAddTeam}
      />

      <EditTeamDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        team={editingTeam}
        onUpdateTeam={handleUpdateTeam}
      />
    </div>
  );
};

export default TeamsManagementPage;