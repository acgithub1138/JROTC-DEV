import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Theme {
  id: string;
  school_id: string;
  jrotc_program: 'army' | 'navy' | 'air_force' | 'marine_corps' | 'coast_guard' | 'space_force';
  primary_color: string;
  secondary_color: string;
  theme_image_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export const useThemes = () => {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [loading, setLoading] = useState(true);
  const { userProfile } = useAuth();

  const fetchThemes = async () => {
    if (!userProfile?.school_id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('themes')
        .select('*')
        .eq('school_id', userProfile.school_id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setThemes(data || []);
    } catch (error) {
      console.error('Error fetching themes:', error);
      toast.error('Failed to load themes');
    } finally {
      setLoading(false);
    }
  };

  const createTheme = async (themeData: Omit<Theme, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => {
    if (!userProfile?.school_id) {
      toast.error('School ID is required');
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('themes')
        .insert({
          ...themeData,
          school_id: userProfile.school_id,
          created_by: userProfile.id
        })
        .select()
        .single();

      if (error) throw error;

      setThemes(prev => [data, ...prev]);
      toast.success('Theme created successfully');
      return data;
    } catch (error) {
      console.error('Error creating theme:', error);
      toast.error('Failed to create theme');
      return null;
    }
  };

  const updateTheme = async (id: string, updates: Partial<Theme>) => {
    try {
      const { data, error } = await supabase
        .from('themes')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setThemes(prev => prev.map(theme => theme.id === id ? data : theme));
      toast.success('Theme updated successfully');
      return data;
    } catch (error) {
      console.error('Error updating theme:', error);
      toast.error('Failed to update theme');
      return null;
    }
  };

  const deleteTheme = async (id: string) => {
    try {
      const { error } = await supabase
        .from('themes')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;

      setThemes(prev => prev.filter(theme => theme.id !== id));
      toast.success('Theme deleted successfully');
      return true;
    } catch (error) {
      console.error('Error deleting theme:', error);
      toast.error('Failed to delete theme');
      return false;
    }
  };

  const uploadThemeImage = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${userProfile?.school_id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('theme-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('theme-images')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
      return null;
    }
  };

  useEffect(() => {
    fetchThemes();
  }, [userProfile?.school_id]);

  return {
    themes,
    loading,
    createTheme,
    updateTheme,
    deleteTheme,
    uploadThemeImage,
    refetch: fetchThemes
  };
};