import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Cadet {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role?: string;
  grade?: string;
  rank?: string;
  flight?: string;
  cadet_year?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
  school_id: string;
}

export const useCadets = () => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  
  const [cadets, setCadets] = useState<Cadet[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCadets = async () => {
    if (!userProfile?.school_id) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('school_id', userProfile.school_id)
        .neq('role', 'instructor')
        .eq('active', true)
        .order('last_name', { ascending: true });

      if (error) throw error;
      setCadets(data || []);
    } catch (error) {
      console.error('Error fetching cadets:', error);
      toast({
        title: "Error",
        description: "Failed to fetch cadets",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getCadetStats = () => {
    const total = cadets.length;
    const active = cadets.filter(cadet => cadet.active).length;
    const leaders = cadets.filter(cadet => 
      cadet.rank && (
        cadet.rank.toLowerCase().includes('captain') ||
        cadet.rank.toLowerCase().includes('lieutenant') ||
        cadet.rank.toLowerCase().includes('sergeant') ||
        cadet.rank.toLowerCase().includes('major') ||
        cadet.rank.toLowerCase().includes('colonel')
      )
    ).length;

    return { total, active, leaders };
  };

  useEffect(() => {
    fetchCadets();
  }, [userProfile?.school_id]);

  return {
    cadets,
    loading,
    fetchCadets,
    getCadetStats
  };
};

export const useCadet = (cadetId: string) => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  
  const [cadet, setCadet] = useState<Cadet | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCadet = async () => {
    if (!cadetId || !userProfile?.school_id) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', cadetId)
        .eq('school_id', userProfile.school_id)
        .single();

      if (error) throw error;
      setCadet(data);
    } catch (error) {
      console.error('Error fetching cadet:', error);
      toast({
        title: "Error",
        description: "Failed to fetch cadet details",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCadet();
  }, [cadetId, userProfile?.school_id]);

  return {
    cadet,
    loading,
    fetchCadet
  };
};