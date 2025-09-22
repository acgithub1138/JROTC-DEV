import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

// Extend types to include the paid, color, total_fee, and registration_source fields since they exist in DB but not in generated types yet
type CompSchool = Database['public']['Tables']['cp_comp_schools']['Row'] & { 
  paid: boolean; 
  color: string; 
  total_fee: number;
  registration_source: string;
};
type CompSchoolInsert = Database['public']['Tables']['cp_comp_schools']['Insert'] & { 
  paid?: boolean; 
  color?: string; 
  total_fee?: number;
  registration_source?: string;
};
type CompSchoolUpdate = Database['public']['Tables']['cp_comp_schools']['Update'] & { 
  paid?: boolean; 
  color?: string; 
  total_fee?: number;
  registration_source?: string;
};

export const useCompetitionSchools = (competitionId?: string) => {
  const { userProfile } = useAuth();
  const [schools, setSchools] = useState<CompSchool[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSchools = async () => {
    if (!competitionId) return;

    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('cp_comp_schools')
        .select('*')
        .eq('competition_id', competitionId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setSchools((data || []) as CompSchool[]);
    } catch (error) {
      console.error('Error fetching competition schools:', error);
      toast.error('Failed to load registered schools');
    } finally {
      setIsLoading(false);
    }
  };

  const createSchoolRegistration = async (schoolData: CompSchoolInsert) => {
    if (!userProfile?.school_id) return;

    try {
      const { data, error } = await supabase
        .from('cp_comp_schools')
        .insert({
          ...schoolData,
          created_by: userProfile.id
        })
        .select()
        .single();

      if (error) throw error;

      setSchools(prev => [...prev, data as CompSchool].sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      ));
      toast.success('School registered successfully');
      return data;
    } catch (error) {
      console.error('Error registering school:', error);
      toast.error('Failed to register school');
      throw error;
    }
  };

  const updateSchoolRegistration = async (id: string, updates: CompSchoolUpdate) => {
    try {
      const { data, error } = await supabase
        .from('cp_comp_schools')
        .update({
          ...updates,
          updated_by: userProfile?.id
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setSchools(prev => 
        prev.map(school => school.id === id ? data as CompSchool : school)
          .sort((a, b) => 
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          )
      );
      toast.success('School registration updated successfully');
      return data;
    } catch (error) {
      console.error('Error updating school registration:', error);
      toast.error('Failed to update school registration');
      throw error;
    }
  };

  const deleteSchoolRegistration = async (id: string) => {
    try {
      // First, get the school registration record to access school_id, competition_id, and calendar_event_id
      const { data: schoolRecord, error: fetchError } = await supabase
        .from('cp_comp_schools')
        .select('school_id, competition_id, calendar_event_id')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;
      if (!schoolRecord) throw new Error('School registration not found');

      const { school_id, competition_id, calendar_event_id } = schoolRecord;

      // Delete related records in order (scoped to this school and competition)
      
      // 1. Delete event schedules for this school in this competition
      const { error: schedulesError } = await supabase
        .from('cp_event_schedules')
        .delete()
        .eq('school_id', school_id)
        .eq('competition_id', competition_id);

      if (schedulesError) {
        console.error('Error deleting event schedules:', schedulesError);
        throw new Error('Failed to delete event schedules');
      }

      // 2. Delete event registrations for this school in this competition
      const { error: registrationsError } = await supabase
        .from('cp_event_registrations')
        .delete()
        .eq('school_id', school_id)
        .eq('competition_id', competition_id);

      if (registrationsError) {
        console.error('Error deleting event registrations:', registrationsError);
        throw new Error('Failed to delete event registrations');
      }

      // 3. Delete the calendar event if it exists
      if (calendar_event_id) {
        const { error: calendarError } = await supabase
          .from('events')
          .delete()
          .eq('id', calendar_event_id);

        if (calendarError) {
          console.error('Error deleting calendar event:', calendarError);
          throw new Error('Failed to delete calendar event');
        }
      }

      // 4. Finally, delete the main school registration record
      const { error } = await supabase
        .from('cp_comp_schools')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setSchools(prev => prev.filter(school => school.id !== id));
      toast.success('School registration and all related records removed successfully');
    } catch (error) {
      console.error('Error deleting school registration:', error);
      toast.error('Failed to remove school registration');
      throw error;
    }
  };

  useEffect(() => {
    fetchSchools();
  }, [competitionId]);

  return {
    schools,
    isLoading,
    createSchoolRegistration,
    updateSchoolRegistration,
    deleteSchoolRegistration,
    refetch: fetchSchools
  };
};