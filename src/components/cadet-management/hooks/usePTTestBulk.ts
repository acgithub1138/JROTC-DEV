import { useState, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export interface PTTestScores {
  pushUps: string;
  sitUps: string;
  plankTime: string;
  mileTime: string;
}

export interface CadetPTData {
  cadetId: string;
  scores: PTTestScores;
}

export const usePTTestBulk = () => {
  const { userProfile } = useAuth();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [cadetData, setCadetData] = useState<Map<string, PTTestScores>>(new Map());

  const updateCadetScore = (cadetId: string, field: keyof PTTestScores, value: string) => {
    setCadetData(prev => {
      const newMap = new Map(prev);
      const existing = newMap.get(cadetId) || { pushUps: '', sitUps: '', plankTime: '', mileTime: '' };
      newMap.set(cadetId, { ...existing, [field]: value });
      return newMap;
    });
  };

  const getCadetScores = (cadetId: string): PTTestScores => {
    return cadetData.get(cadetId) || { pushUps: '', sitUps: '', plankTime: '', mileTime: '' };
  };

  const hasPushUpsData = (scores: PTTestScores): boolean => {
    return scores.pushUps.trim() !== '';
  };

  const parseTimeToSeconds = (timeStr: string): number | null => {
    if (!timeStr.trim()) return null;
    
    // If it's already just seconds
    if (/^\d+$/.test(timeStr)) {
      return parseInt(timeStr);
    }
    
    // If it's MM:SS format
    const match = timeStr.match(/^(\d+):(\d+)$/);
    if (match) {
      const minutes = parseInt(match[1]);
      const seconds = parseInt(match[2]);
      return minutes * 60 + seconds;
    }
    
    // Default to treating as seconds
    const parsed = parseInt(timeStr);
    return isNaN(parsed) ? null : parsed;
  };

  const cadetDataWithPushUps = useMemo(() => {
    const results: CadetPTData[] = [];
    cadetData.forEach((scores, cadetId) => {
      if (hasPushUpsData(scores)) {
        results.push({ cadetId, scores });
      }
    });
    return results;
  }, [cadetData]);

  const savePTTests = async (date: Date, cadets: CadetPTData[]) => {
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
        description: "Please enter Push-Ups scores for at least one cadet",
        variant: "destructive",
      });
      return false;
    }

    setLoading(true);
    try {
      const ptTestRecords = cadets.map(({ cadetId, scores }) => ({
        school_id: userProfile.school_id,
        cadet_id: cadetId,
        date: date.toISOString().split('T')[0],
        push_ups: scores.pushUps.trim() ? parseInt(scores.pushUps) : null,
        sit_ups: scores.sitUps.trim() ? parseInt(scores.sitUps) : null,
        plank_time: parseTimeToSeconds(scores.plankTime),
        mile_time: parseTimeToSeconds(scores.mileTime),
      }));

      const { error } = await supabase
        .from('pt_tests')
        .insert(ptTestRecords);

      if (error) {
        console.error('Error saving PT tests:', error);
        toast({
          title: "Error",
          description: "Failed to save PT test results",
          variant: "destructive",
        });
        return false;
      }

      // Invalidate PT tests queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['pt-tests'] });
      
      toast({
        title: "Success",
        description: `Saved PT test results for ${cadets.length} cadet${cadets.length > 1 ? 's' : ''}`,
      });

      // Reset data
      setCadetData(new Map());
      return true;
    } catch (error) {
      console.error('Error saving PT tests:', error);
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
    cadetDataWithPushUps,
    savePTTests,
    resetData,
  };
};