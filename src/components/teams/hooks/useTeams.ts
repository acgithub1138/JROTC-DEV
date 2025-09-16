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
      
      // Use the optimized view to fetch teams with members and lead info in one query
      const { data: teamsData, error: teamsError } = await supabase
        .from('teams_with_members')
        .select('*')
        .eq('school_id', userProfile.school_id)
        .order('created_at', { ascending: false });

      if (teamsError) throw teamsError;

      // Transform the data to match the expected structure
      const transformedTeams: TeamWithMembers[] = (teamsData || []).map(team => ({
        id: team.id,
        name: team.name,
        description: team.description,
        team_lead_id: team.team_lead_id,
        school_id: team.school_id,
        created_at: team.created_at,
        updated_at: team.updated_at,
        team_lead: team.team_lead_first_name ? {
          id: team.team_lead_id,
          first_name: team.team_lead_first_name,
          last_name: team.team_lead_last_name,
          email: team.team_lead_email
        } : null,
        team_members: Array.isArray(team.team_members) ? team.team_members.map((member: any) => ({
          id: member.id,
          team_id: member.team_id,
          cadet_id: member.cadet_id,
          role: member.role,
          joined_at: member.joined_at
        })) : [],
        member_count: team.member_count
      }));

      setTeams(transformedTeams);
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