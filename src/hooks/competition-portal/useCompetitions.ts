import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import { useSchoolTimezone } from '@/hooks/useSchoolTimezone';
import type { Database } from '@/integrations/supabase/types';

type Competition = Database['public']['Tables']['cp_competitions']['Row'];
type CompetitionInsert = Database['public']['Tables']['cp_competitions']['Insert'];
type CompetitionUpdate = Database['public']['Tables']['cp_competitions']['Update'];

export const useCompetitions = () => {
  const { userProfile } = useAuth();
  const { timezone } = useSchoolTimezone();
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCompetitions = async () => {
    try {
      setIsLoading(true);
      let query = supabase
        .from('cp_competitions')
        .select('*');

      if (userProfile?.school_id) {
        query = query.or(`school_id.eq.${userProfile.school_id},is_public.eq.true`);
      } else {
        query = query.eq('is_public', true);
      }

      const { data, error } = await query.order('start_date', { ascending: false });

      if (error) throw error;
      setCompetitions(data || []);
    } catch (error) {
      console.error('Error fetching competitions:', error);
      toast.error('Failed to load competitions');
    } finally {
      setIsLoading(false);
    }
  };

  const createCompetition = async (competitionData: CompetitionInsert) => {
    if (!userProfile?.school_id) return;

    try {
      const { data, error } = await supabase
        .from('cp_competitions')
        .insert({
          ...competitionData,
          school_id: userProfile.school_id,
          created_by: userProfile.id
        })
        .select()
        .single();

      if (error) throw error;

      setCompetitions(prev => [data, ...prev]);
      toast.success('Competition created successfully');
      return data;
    } catch (error) {
      console.error('Error creating competition:', error);
      toast.error('Failed to create competition');
      throw error;
    }
  };

  const updateCompetition = async (id: string, updates: CompetitionUpdate) => {
    try {
      const { data, error } = await supabase
        .from('cp_competitions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setCompetitions(prev => 
        prev.map(comp => comp.id === id ? data : comp)
      );
      toast.success('Competition updated successfully');
      return data;
    } catch (error) {
      console.error('Error updating competition:', error);
      toast.error('Failed to update competition');
      throw error;
    }
  };

  const deleteCompetition = async (id: string) => {
    try {
      const { error } = await supabase
        .from('cp_competitions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setCompetitions(prev => prev.filter(comp => comp.id !== id));
      toast.success('Competition deleted successfully');
    } catch (error) {
      console.error('Error deleting competition:', error);
      toast.error('Failed to delete competition');
      throw error;
    }
  };

  const copyCompetition = async (originalId: string, newName: string, newStartDate: Date, newEndDate: Date) => {
    if (!userProfile?.school_id) {
      toast.error('User school not found');
      return;
    }

    try {
      // Fetch the original competition
      const { data: originalCompetition, error: compError } = await supabase
        .from('cp_competitions')
        .select('*')
        .eq('id', originalId)
        .single();

      if (compError) throw compError;

      // Fetch the original competition events
      const { data: originalEvents, error: eventsError } = await supabase
        .from('cp_comp_events')
        .select('*')
        .eq('competition_id', originalId);

      if (eventsError) throw eventsError;

      // Calculate the date difference for time adjustments
      const originalStartDate = new Date(originalCompetition.start_date);
      const dateDifferenceMs = newStartDate.getTime() - originalStartDate.getTime();

      // Create the new competition
      const newCompetitionData = {
        ...originalCompetition,
        id: undefined, // Let database generate new ID
        name: newName,
        start_date: newStartDate.toISOString(),
        end_date: newEndDate.toISOString(),
        status: 'draft',
        school_id: userProfile.school_id,
        created_by: userProfile.id,
        is_public: true,
        created_at: undefined,
        updated_at: undefined,
        // Calculate new registration deadline if it existed
        registration_deadline: originalCompetition.registration_deadline 
          ? new Date(new Date(originalCompetition.registration_deadline).getTime() + dateDifferenceMs).toISOString()
          : null
      };

      const { data: newCompetition, error: newCompError } = await supabase
        .from('cp_competitions')
        .insert(newCompetitionData)
        .select()
        .single();

      if (newCompError) throw newCompError;

      // Copy events with adjusted times
      if (originalEvents && originalEvents.length > 0) {
        const newEvents = originalEvents.map(event => {
          const adjustTime = (timeStr: string | null) => {
            if (!timeStr) return null;
            
            // Convert UTC time to school timezone to get the time of day
            const originalTime = toZonedTime(new Date(timeStr), timezone);
            const hours = originalTime.getHours();
            const minutes = originalTime.getMinutes();
            const seconds = originalTime.getSeconds();
            
            // Apply the same time of day to the new competition date
            const newDateTime = new Date(newStartDate);
            newDateTime.setHours(hours, minutes, seconds, 0);
            
            // Convert back to UTC for storage
            return fromZonedTime(newDateTime, timezone).toISOString();
          };

          const { id, created_at, updated_at, updated_by, ...eventData } = event;
          
          return {
            ...eventData,
            competition_id: newCompetition.id,
            school_id: userProfile.school_id,
            created_by: userProfile.id,
            start_time: adjustTime(event.start_time),
            end_time: adjustTime(event.end_time),
            lunch_start_time: adjustTime(event.lunch_start_time),
            lunch_end_time: adjustTime(event.lunch_end_time),
          };
        });

        const { error: eventsInsertError } = await supabase
          .from('cp_comp_events')
          .insert(newEvents);

        if (eventsInsertError) throw eventsInsertError;
      }

      // Update local state
      setCompetitions(prev => [newCompetition, ...prev]);
      
      toast.success(`Competition "${newName}" copied successfully`);
      return newCompetition;
    } catch (error) {
      console.error('Error copying competition:', error);
      toast.error('Failed to copy competition');
      throw error;
    }
  };

  useEffect(() => {
    fetchCompetitions();
  }, [userProfile?.school_id]);

  return {
    competitions,
    isLoading,
    createCompetition,
    updateCompetition,
    deleteCompetition,
    copyCompetition,
    refetch: fetchCompetitions
  };
};