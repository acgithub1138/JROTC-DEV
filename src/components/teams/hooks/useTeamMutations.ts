import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { NewTeam, TeamWithMembers } from '../types';

export const useTeamMutations = () => {
  const { userProfile } = useAuth();
  const { toast } = useToast();

  const createTeam = async (teamData: NewTeam): Promise<boolean> => {
    if (!userProfile?.school_id) {
      toast({
        title: "Error",
        description: "No school information found",
        variant: "destructive"
      });
      return false;
    }

    try {
      // Create the team
      const { data: teamResult, error: teamError } = await supabase
        .from('teams')
        .insert({
          name: teamData.name,
          description: teamData.description || null,
          team_lead_id: teamData.team_lead_id || null,
          school_id: userProfile.school_id
        })
        .select()
        .single();

      if (teamError) throw teamError;

      // Add team members if any
      if (teamData.member_ids.length > 0) {
        const memberInserts = teamData.member_ids.map(cadetId => ({
          team_id: teamResult.id,
          cadet_id: cadetId
        }));

        const { error: membersError } = await supabase
          .from('team_members')
          .insert(memberInserts);

        if (membersError) throw membersError;
      }

      toast({
        title: "Success",
        description: "Team created successfully"
      });

      return true;
    } catch (error) {
      console.error('Error creating team:', error);
      toast({
        title: "Error",
        description: "Failed to create team",
        variant: "destructive"
      });
      return false;
    }
  };

  const updateTeam = async (teamId: string, teamData: Partial<TeamWithMembers>): Promise<boolean> => {
    try {
      // Update team basic info
      const { error: teamError } = await supabase
        .from('teams')
        .update({
          name: teamData.name,
          description: teamData.description || null,
          team_lead_id: teamData.team_lead_id || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', teamId);

      if (teamError) throw teamError;

      // Update team members if provided
      if (teamData.member_ids !== undefined) {
        // First, remove all existing members
        const { error: deleteError } = await supabase
          .from('team_members')
          .delete()
          .eq('team_id', teamId);

        if (deleteError) throw deleteError;

        // Then add new members
        if (teamData.member_ids.length > 0) {
          const memberInserts = teamData.member_ids.map(cadetId => ({
            team_id: teamId,
            cadet_id: cadetId
          }));

          const { error: membersError } = await supabase
            .from('team_members')
            .insert(memberInserts);

          if (membersError) throw membersError;
        }
      }

      toast({
        title: "Success",
        description: "Team updated successfully"
      });

      return true;
    } catch (error) {
      console.error('Error updating team:', error);
      toast({
        title: "Error",
        description: "Failed to update team",
        variant: "destructive"
      });
      return false;
    }
  };

  const deleteTeam = async (teamId: string): Promise<boolean> => {
    try {
      // Delete team members first (cascade should handle this, but being explicit)
      const { error: membersError } = await supabase
        .from('team_members')
        .delete()
        .eq('team_id', teamId);

      if (membersError) throw membersError;

      // Delete the team
      const { error: teamError } = await supabase
        .from('teams')
        .delete()
        .eq('id', teamId);

      if (teamError) throw teamError;

      toast({
        title: "Success",
        description: "Team deleted successfully"
      });

      return true;
    } catch (error) {
      console.error('Error deleting team:', error);
      toast({
        title: "Error",
        description: "Failed to delete team",
        variant: "destructive"
      });
      return false;
    }
  };

  return {
    createTeam,
    updateTeam,
    deleteTeam
  };
};