import { useState, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export interface UniformInspectionScores {
  grade: string;
  notes: string;
}

export interface CadetUniformData {
  cadetId: string;
  scores: UniformInspectionScores;
}

export const useUniformInspectionBulk = () => {
  const { userProfile } = useAuth();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [cadetData, setCadetData] = useState<Map<string, UniformInspectionScores>>(new Map());

  const updateCadetScore = (cadetId: string, field: keyof UniformInspectionScores, value: string) => {
    setCadetData(prev => {
      const newMap = new Map(prev);
      const existing = newMap.get(cadetId) || { grade: '', notes: '' };
      newMap.set(cadetId, { ...existing, [field]: value });
      return newMap;
    });
  };

  const getCadetScores = (cadetId: string): UniformInspectionScores => {
    return cadetData.get(cadetId) || { grade: '', notes: '' };
  };

  const hasScoreData = (scores: UniformInspectionScores): boolean => {
    return scores.grade.trim() !== '';
  };

  const cadetDataWithScores = useMemo(() => {
    const results: CadetUniformData[] = [];
    cadetData.forEach((scores, cadetId) => {
      if (hasScoreData(scores)) {
        results.push({ cadetId, scores });
      }
    });
    return results;
  }, [cadetData]);

  const saveUniformInspections = async (date: Date, cadets: CadetUniformData[]) => {
    if (!userProfile?.school_id) {
      toast({
        title: "Error",
        description: "School information not found",
        variant: "destructive",
      });
      return false;
    }

    if (cadets.length === 0) {
      toast({
        title: "No Data",
        description: "Please enter scores for at least one cadet",
        variant: "destructive",
      });
      return false;
    }

    setLoading(true);
    try {
      const inspectionRecords = cadets.map(({ cadetId, scores }) => ({
        school_id: userProfile.school_id,
        cadet_id: cadetId,
        date: date.toISOString().split('T')[0],
        grade: scores.grade.trim() ? parseInt(scores.grade) : null,
        notes: scores.notes.trim() || null,
      }));

      const { error } = await (supabase as any)
        .from('uniform_inspections')
        .insert(inspectionRecords);

      if (error) {
        console.error('Error saving uniform inspections:', error);
        toast({
          title: "Error",
          description: "Failed to save uniform inspection results",
          variant: "destructive",
        });
        return false;
      }

      // Invalidate uniform inspections queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['uniform-inspections'] });
      
      toast({
        title: "Success",
        description: `Saved uniform inspection results for ${cadets.length} cadet${cadets.length > 1 ? 's' : ''}`,
      });

      // Reset data
      setCadetData(new Map());
      return true;
    } catch (error) {
      console.error('Error saving uniform inspections:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const resetData = () => {
    setCadetData(new Map());
  };

  return {
    loading,
    cadetData,
    updateCadetScore,
    getCadetScores,
    cadetDataWithScores,
    saveUniformInspections,
    resetData,
  };
};