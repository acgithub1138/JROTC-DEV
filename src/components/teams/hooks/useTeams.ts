import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { TeamWithMembers } from '../types';

export const useTeams = () => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  
  const [teams, setTeams] = useState<TeamWithMembers[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTeams = async () => {
    if (!userProfile?.school_id) return;

    try {
      setLoading(true);
      
      // First fetch teams with team lead info
      const { data: teamsData, error: teamsError } = await supabase
        .from('teams')
        .select(`
          *,
          team_lead:profiles!teams_team_lead_id_fkey(
            id,
            first_name,
            last_name,
            email
          )
        `)
        .eq('school_id', userProfile.school_id)
        .order('created_at', { ascending: false });

      if (teamsError) throw teamsError;

      // Then fetch team members for each team
      const teamsWithMembers: TeamWithMembers[] = [];
      
      for (const team of teamsData || []) {
        const { data: membersData, error: membersError } = await supabase
          .from('team_members')
          .select('*')
          .eq('team_id', team.id);

        if (membersError) {
          console.error('Error fetching team members:', membersError);
          continue;
        }

        teamsWithMembers.push({
          ...team,
          team_members: membersData || [],
          member_count: membersData?.length || 0
        });
      }

      setTeams(teamsWithMembers);
    } catch (error) {
      console.error('Error fetching teams:', error);
      toast({
        title: "Error",
        description: "Failed to fetch teams",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userProfile?.school_id) {
      fetchTeams();
    }
  }, [userProfile?.school_id]);

  const refetch = () => {
    fetchTeams();
  };

  return {
    teams,
    loading,
    refetch
  };
};